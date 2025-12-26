const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { protect } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/authMiddleware');

// Get all notices (Protected for all users)
router.get('/', protect, async (req, res) => {
    try {
        const notices = await Notice.find({}).sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all notices for admin (Admin only)
router.get('/admin/notices', protect, adminMiddleware, async (req, res) => {
    try {
        const notices = await Notice.find({}).sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create notice (Admin only)
router.post('/admin/notices', protect, adminMiddleware, async (req, res) => {
    try {
        const { title, description, expiryDate } = req.body;

        if (!title || !description || !expiryDate) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const notice = await Notice.create({
            title,
            description,
            expiryDate
        });

        res.status(201).json(notice);
    } catch (error) {
        console.error('Error creating notice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete notice (Admin only)
router.delete('/admin/notices/:id', protect, adminMiddleware, async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);

        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        await notice.deleteOne();
        res.json({ message: 'Notice removed' });
    } catch (error) {
        console.error('Error deleting notice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
