import express from 'express';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/connections
// @desc    Create a new connection request (student -> industry)
// @access  Private / Student
router.post('/', protect, authorize('student'), async (req, res) => {
    try {
        const { industryId, message } = req.body;
        const studentId = req.user.id;

        // Verify industry partner exists
        const industryPartner = await User.findById(industryId);
        if (!industryPartner) {
            return res.status(404).json({ message: 'Industry partner not found' });
        }

        // Check if connection already exists
        const existingConnection = await Connection.findOne({ student: studentId, industryPartner: industryId });
        if (existingConnection) {
            return res.status(400).json({ message: 'Request already sent to this partner' });
        }

        const connection = await Connection.create({
            student: studentId,
            industryPartner: industryId,
            message: message || '',
        });

        // Notify industry partner
        const student = await User.findById(studentId).select('name');
        await Notification.create({
            type: 'user_created', // Note: maybe a new 'connection_request' type is better, using existing for compatibility
            message: `Student ${student?.name || 'A student'} wants to connect with you.`,
            actorName: student?.name || 'Student',
            actorRole: 'student',
        });

        res.status(201).json(connection);
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Request already sent to this partner' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/connections/student
// @desc    Get all connection requests for the logged-in student
// @access  Private / Student
router.get('/student', protect, authorize('student'), async (req, res) => {
    try {
        const connections = await Connection.find({ student: req.user.id })
            .populate('industryPartner', 'name email companyName industryName')
            .sort({ createdAt: -1 });

        res.json(connections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/connections/industry
// @desc    Get all connection requests for the logged-in industry partner
// @access  Private / Industry Partner, Admin, Super-Admin
router.get('/industry', protect, authorize('industry_partner', 'admin', 'super-admin'), async (req, res) => {
    try {
        const connections = await Connection.find({ industryPartner: req.user.id })
            .populate('student', 'name email department year domain')
            .sort({ createdAt: -1 });

        res.json(connections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/connections/:id
// @desc    Update connection status (accept/decline)
// @access  Private / Industry Partner, Admin, Super-Admin
router.put('/:id', protect, authorize('industry_partner', 'admin', 'super-admin'), async (req, res) => {
    try {
        const { status } = req.body;
        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const connection = await Connection.findById(req.params.id);

        if (!connection) {
            return res.status(404).json({ message: 'Connection not found' });
        }

        // Verify the industry partner owns this request
        if (connection.industryPartner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this connection' });
        }

        connection.status = status;
        await connection.save();

        res.json(connection);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
