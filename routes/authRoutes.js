const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateProfile, getProfile, updateCommunityRead, getUserCount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.put('/profile', protect, updateProfile);
router.get('/profile', protect, getProfile);
router.put('/read-community', protect, updateCommunityRead);
router.get('/users/count', protect, getUserCount);

module.exports = router;
