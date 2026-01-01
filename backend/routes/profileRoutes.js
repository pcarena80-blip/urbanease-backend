const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserProfileById } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getProfile).put(protect, updateProfile);
router.get('/:id', protect, getUserProfileById);

module.exports = router;
