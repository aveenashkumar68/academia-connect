import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import FacultyAssignment from '../models/FacultyAssignment.js';
import { protect } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';
import upload from '../middleware/upload.js';
import { sendPasswordResetOTP, sendPasswordResetConfirmation } from '../utils/mailer.js';

const router = express.Router();

// Generate Token
const generateToken = (id, role, tokenVersion) => {
    return jwt.sign({ id, role, tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @route   POST /api/auth/login
// @desc    Auth user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Increment token version to invalidate previous sessions (multi-device management)
            const oldVersion = user.tokenVersion || 0;
            user.tokenVersion = Number(oldVersion) + 1;            
            await user.save();            const responseData = {
                _id: user._id,
                email: user.email,
                role: user.role,
                name: user.name,
                department: user.department,
                domain: user.domain,
                profilePicture: user.profilePicture,
                token: generateToken(user._id, user.role, user.tokenVersion),
            };

            // Attach all assignments for faculty (admin) users
            if (user.role === 'admin') {
                responseData.assignments = await FacultyAssignment.find({ faculty: user._id }).lean();
            }

            res.json(responseData);
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════════════
//  FORGOT PASSWORD FLOW (Public — no protect middleware)
// ═══════════════════════════════════════════════════════════════

// @route   POST /api/auth/forgot-password
// @desc    Send a 6-digit OTP to the user's email
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const successMsg = 'If an account with that email exists, a password reset OTP has been sent.';

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.json({ message: successMsg });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        user.resetOtp = hashedOtp;
        user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.resetOtpAttempts = 0;
        await user.save();

        const userName = user.name || user.email.split('@')[0];
        await sendPasswordResetOTP(user.email, userName, otp);

        res.json({ message: successMsg });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify the OTP and return a short-lived reset token
// @access  Public
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.resetOtp || !user.resetOtpExpiry) {
            return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new one.' });
        }

        if (new Date() > user.resetOtpExpiry) {
            user.resetOtp = undefined;
            user.resetOtpExpiry = undefined;
            user.resetOtpAttempts = 0;
            await user.save();
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        if (user.resetOtpAttempts >= 5) {
            user.resetOtp = undefined;
            user.resetOtpExpiry = undefined;
            user.resetOtpAttempts = 0;
            await user.save();
            return res.status(429).json({ message: 'Too many failed attempts. Please request a new OTP.' });
        }

        const isMatch = await bcrypt.compare(otp, user.resetOtp);
        if (!isMatch) {
            user.resetOtpAttempts += 1;
            await user.save();
            const remaining = 5 - user.resetOtpAttempts;
            return res.status(400).json({
                message: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
            });
        }

        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;
        user.resetOtpAttempts = 0;
        await user.save();

        const resetToken = jwt.sign(
            { id: user._id, purpose: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        res.json({ message: 'OTP verified successfully', resetToken });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset the password using the reset token
// @access  Public (requires valid reset token)
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: 'Reset token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ message: 'Reset link has expired. Please start over.' });
        }

        if (decoded.purpose !== 'password_reset') {
            return res.status(400).json({ message: 'Invalid reset token' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        const userName = user.name || user.email.split('@')[0];
        sendPasswordResetConfirmation(user.email, userName).catch((err) => {
            console.error('Confirmation email error:', err.message);
        });

        res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', protect, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        // Invalidate all existing sessions on password change
        user.tokenVersion = (user.tokenVersion || 0) + 1;

        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, phone, department, address } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name !== undefined) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (department !== undefined) user.department = department;
        if (address !== undefined) user.address = address;
        await user.save();

        res.json({
            message: 'Profile updated successfully, please login again to see changes',
            name: user.name, phone: user.phone,
            department: user.department, address: user.address,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/auth/password
// @desc    Change user password using PUT
// @access  Private
router.put('/password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        // Invalidate all existing sessions on password change
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/avatar
// @desc    Upload profile picture to Cloudinary
// @access  Private
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Upload buffer to Cloudinary via stream
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'mayaa-avatars',
                    transformation: [
                        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
                        { quality: 'auto', fetch_format: 'auto' },
                    ],
                    public_id: `user_${user._id}`,
                    overwrite: true,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        user.profilePicture = result.secure_url;
        await user.save();

        res.json({ message: 'Profile picture updated', profilePicture: result.secure_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to upload image' });
    }
});

// @route   DELETE /api/auth/avatar
// @desc    Remove profile picture from Cloudinary and clear DB field
// @access  Private
router.delete('/avatar', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.profilePicture) {
            return res.status(400).json({ message: 'No profile picture to remove' });
        }

        // Extract the public_id from the Cloudinary URL
        // URL format: https://res.cloudinary.com/<cloud>/image/upload/v<ver>/<folder>/<public_id>.<ext>
        try {
            const urlParts = user.profilePicture.split('/');
            const folderAndFile = urlParts.slice(-2); // ['mayaa-avatars', 'user_xxx.jpg']
            const fileWithoutExt = folderAndFile[1].split('.')[0];
            const publicId = `${folderAndFile[0]}/${fileWithoutExt}`;
            await cloudinary.uploader.destroy(publicId);
        } catch (cloudErr) {
            console.error('Cloudinary delete error (non-fatal):', cloudErr);
            // Continue even if Cloudinary delete fails — still clear the DB field
        }

        user.profilePicture = '';
        await user.save();

        res.json({ message: 'Profile picture removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to remove profile picture' });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user & invalidate session
// @access  Private
router.post('/logout', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            await user.save();
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
