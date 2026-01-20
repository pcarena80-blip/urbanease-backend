const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { protect } = require('../middleware/authMiddleware');

// Get all notices (for mobile app)
router.get('/', protect, async (req, res) => {
    try {
        // Get active notices (expiryDate >= today 00:00:00), sorted by newest first
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const notices = await Notice.find({ expiryDate: { $gte: today } }).sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
