const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { protect } = require('../middleware/authMiddleware');

// Get all notices (for mobile app)
router.get('/', protect, async (req, res) => {
    try {
        // Get all notices, sorted by newest first
        const notices = await Notice.find().sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
