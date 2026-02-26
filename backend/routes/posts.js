import express from 'express';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts (newest first), optional query filters
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { type, department } = req.query;
        const filter = {};
        if (type && type !== 'all') filter.postType = type;
        if (department && department !== 'all') filter.department = department;

        const posts = await Post.find(filter)
            .sort({ isUrgent: -1, createdAt: -1 })
            .limit(200)
            .lean();

        // Add likeCount and isLiked for the requesting user
        const userId = req.user.id;
        const result = posts.map(p => ({
            ...p,
            likeCount: p.likes?.length || 0,
            isLiked: p.likes?.some(id => id.toString() === userId) || false,
            likes: undefined, // don't send full array
        }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { title, message, postType, department, targetAudience, location,
            companyName, industryName, contactPerson, contactEmail, contactPhone, website,
            requirements, experience, compensation, duration, registrationDeadline,
            eventDate, eventTime, tags, isUrgent } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }
        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const user = await User.findById(req.user.id).select('name role department');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const post = await Post.create({
            author: req.user.id,
            authorName: user.name || 'Unknown',
            authorRole: user.role,
            authorDepartment: user.department,
            title: title.trim(),
            message: message.trim(),
            postType: postType || 'general',
            department, targetAudience, location,
            companyName, industryName, contactPerson, contactEmail, contactPhone, website,
            requirements, experience, compensation, duration,
            registrationDeadline: registrationDeadline || null,
            eventDate: eventDate || null,
            eventTime,
            tags: tags || [],
            isUrgent: isUrgent || false,
        });

        // Auto-create notification
        const typeLabel = postType ? postType.charAt(0).toUpperCase() + postType.slice(1) : 'General';
        await Notification.create({
            type: 'post_created',
            message: `${user.name || 'A user'} shared a new ${typeLabel} post: "${title.trim().slice(0, 60)}"`,
            actorName: user.name || 'Unknown',
            actorRole: user.role,
        });

        res.status(201).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/posts/:id/like
// @desc    Toggle like on a post
// @access  Private
router.put('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const userId = req.user.id;
        const idx = post.likes.findIndex(id => id.toString() === userId);

        if (idx === -1) {
            post.likes.push(userId);
        } else {
            post.likes.splice(idx, 1);
        }

        await post.save();
        res.json({ likeCount: post.likes.length, isLiked: idx === -1 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/posts/:id
// @desc    Delete own post
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.user.id && req.user.role !== 'super-admin') {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await post.deleteOne();
        res.json({ message: 'Post deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
