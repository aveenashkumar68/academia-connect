import express from 'express';
import Department from '../models/Department.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/departments
// @desc    Get all departments
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.json(departments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/departments
// @desc    Create a department
// @access  Private / Super-Admin
router.post('/', protect, authorize('super-admin'), async (req, res) => {
    try {
        const { name, domains } = req.body;
        const deptExists = await Department.findOne({ name });
        if (deptExists) {
            return res.status(400).json({ message: 'Department already exists' });
        }
        const department = await Department.create({ name, domains });
        res.status(201).json(department);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/departments/:id
// @desc    Update a department
// @access  Private / Super-Admin
router.put('/:id', protect, authorize('super-admin'), async (req, res) => {
    try {
        const { name, domains } = req.body;
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        department.name = name || department.name;
        department.domains = domains || department.domains;
        const updatedDept = await department.save();
        res.json(updatedDept);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/departments/:id
// @desc    Delete a department
// @access  Private / Super-Admin
router.delete('/:id', protect, authorize('super-admin'), async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        await department.deleteOne();
        res.json({ message: 'Department removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
