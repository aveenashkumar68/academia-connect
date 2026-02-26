import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendCredentialsEmail } from '../utils/mailer.js';
import crypto from 'crypto';

const router = express.Router();

// Helper to generate random password
const generateRandomPassword = () => {
    return crypto.randomBytes(8).toString('hex');
};

// @route   POST /api/users/admin
// @desc    Create an admin user
// @access  Private / Super-Admin
router.post('/admin', protect, authorize('super-admin'), async (req, res) => {
    try {
        const { email, name, department, phone } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const unhashedPassword = generateRandomPassword();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(unhashedPassword, salt);

        const user = await User.create({
            email,
            password: hashedPassword,
            role: 'admin',
            name,
            department,
            phone,
        });

        if (user) {
            // Send email with credentials
            await sendCredentialsEmail(email, 'Admin', email, unhashedPassword);

            // Auto-create notification
            await Notification.create({
                type: 'user_created',
                message: `New faculty member ${name || email} has been added`,
                actorName: 'Super Admin',
                actorRole: 'super-admin',
            });

            res.status(201).json({
                _id: user._id,
                email: user.email,
                role: user.role,
                message: 'Admin account created and credentials sent to email',
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/users/student
// @desc    Create a student user
// @access  Private / Admin
router.post('/student', protect, authorize('admin'), async (req, res) => {
    try {
        const { email, name, phone, department, year, regNo, domain } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const unhashedPassword = generateRandomPassword();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(unhashedPassword, salt);

        const user = await User.create({
            email,
            password: hashedPassword,
            role: 'student',
            name,
            phone,
            department,
            year,
            regNo,
            domain,
        });

        if (user) {
            // Send email with credentials
            await sendCredentialsEmail(email, 'Student', email, unhashedPassword);

            // Auto-create notification
            const creator = await User.findById(req.user.id).select('name');
            await Notification.create({
                type: 'user_created',
                message: `New student ${email} has been added by ${creator?.name || 'faculty'}`,
                actorName: creator?.name || 'Faculty',
                actorRole: 'admin',
            });

            res.status(201).json({
                _id: user._id,
                email: user.email,
                role: user.role,
                message: 'Student account created and credentials sent to email',
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/stats
// @desc    Get dashboard stats
// @access  Private / Super-Admin
router.get('/stats', protect, authorize('super-admin'), async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'student' });
        const facultyCount = await User.countDocuments({ role: 'admin' });

        // Count unique departments
        const departments = await User.distinct('department', { department: { $ne: null, $ne: '' } });
        const departmentCount = departments.length;

        // Activities could be anything, but for now we'll return a placeholder or 0
        const activityCount = 0;

        res.json({
            students: studentCount,
            faculty: facultyCount,
            departments: departmentCount,
            activities: activityCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/role/:role
// @desc    Get users by role
// @access  Private / Super-Admin
router.get('/role/:role', protect, authorize('super-admin'), async (req, res) => {
    try {
        const users = await User.find({ role: req.params.role }).select('-password');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/departments/all
// @desc    Get all departments with their domains
// @access  Private / Super-Admin
router.get('/departments/all', protect, authorize('super-admin'), async (req, res) => {
    try {
        const departmentsWithDomains = await User.aggregate([
            { $match: { department: { $ne: null, $ne: '' } } },
            {
                $group: {
                    _id: "$department",
                    domains: { $addToSet: "$domain" }
                }
            },
            {
                $project: {
                    name: "$_id",
                    domains: {
                        $filter: {
                            input: "$domains",
                            as: "domain",
                            cond: { $and: [{ $ne: ["$$domain", null] }, { $ne: ["$$domain", ""] }] }
                        }
                    },
                    _id: 0
                }
            }
        ]);
        res.json(departmentsWithDomains);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/domain/:domain
// @desc    Get students by domain
// @access  Private / Super-Admin
router.get('/domain/:domain', protect, authorize('super-admin'), async (req, res) => {
    try {
        const students = await User.find({
            role: 'student',
            domain: req.params.domain
        }).select('-password');
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
