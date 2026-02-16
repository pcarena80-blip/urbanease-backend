const express = require('express');
const router = express.Router();
const { requestNoticesScreen, submitNotice, deleteNotice } = require('../controllers/noticeController');
const { protect } = require('../middleware/authMiddleware');

// Get all notices (Protected)
router.get('/', protect, requestNoticesScreen);

// Admin Routes would go here (protected + admin check)
// For now, just exposing get for the mobile app
// router.post('/', protect, admin, createNotice);
// router.delete('/:id', protect, admin, deleteNotice);

module.exports = router;
