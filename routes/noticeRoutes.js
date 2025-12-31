const express = require('express');
const router = express.Router();

// Inline Middleware
const protect = async (req, res, next) => {
    req.user = { id: 'mock', name: 'Mock User' };
    next();
};

const adminMiddleware = (req, res, next) => {
    next();
};

// Mock Data
let mockNotices = [
    { _id: '1', title: 'Power Maintenance', description: 'Electricity will be off tomorrow 9-5', expiryDate: '2025-12-31' },
    { _id: '2', title: 'Community Meeting', description: 'Meeting at club house at 5PM', expiryDate: '2025-12-30' }
];

// Get all notices
router.get('/', protect, async (req, res) => {
    res.json(mockNotices);
});

// Admin routes (Mock)
router.get('/admin/notices', protect, adminMiddleware, async (req, res) => {
    res.json(mockNotices);
});

router.post('/admin/notices', protect, adminMiddleware, async (req, res) => {
    const { title, description, expiryDate } = req.body;
    const newNotice = { _id: Date.now().toString(), title, description, expiryDate };
    mockNotices.push(newNotice);
    res.status(201).json(newNotice);
});

router.delete('/admin/notices/:id', protect, adminMiddleware, async (req, res) => {
    mockNotices = mockNotices.filter(n => n._id !== req.params.id);
    res.json({ message: 'Notice removed' });
});

module.exports = router;
