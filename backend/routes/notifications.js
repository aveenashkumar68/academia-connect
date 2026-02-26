import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get last 50 notifications (for dropdown)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Add isRead flag per user
        const userId = req.user.id;
        const result = notifications.map(n => ({
            ...n,
            isRead: n.readBy?.some(id => id.toString() === userId) || false,
        }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/notifications/all
// @desc    Get all notifications (for full page)
// @access  Private
router.get('/all', protect, async (req, res) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .lean();

        const userId = req.user.id;
        const result = notifications.map(n => ({
            ...n,
            isRead: n.readBy?.some(id => id.toString() === userId) || false,
        }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/notifications/count
// @desc    Get unread notification count for current user
// @access  Private
router.get('/count', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await Notification.countDocuments({
            readBy: { $ne: userId }
        });
        res.json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/notifications/mark-read
// @desc    Mark specific notifications as read for current user
// @access  Private
router.put('/mark-read', protect, async (req, res) => {
    try {
        const { ids } = req.body; // array of notification IDs
        const userId = req.user.id;

        if (ids && ids.length > 0) {
            await Notification.updateMany(
                { _id: { $in: ids }, readBy: { $ne: userId } },
                { $addToSet: { readBy: userId } }
            );
        }

        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read for current user
// @access  Private
router.put('/mark-all-read', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.updateMany(
            { readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );
        res.json({ message: 'All marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
