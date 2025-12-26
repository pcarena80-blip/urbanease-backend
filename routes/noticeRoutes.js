const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { protect } = require('../middleware/authMiddleware');

// Get all notices (Public/Protected for all users)
router.get('/', protect, async (req, res) => {
    try {
        const notices = await Notice.find({}).sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
