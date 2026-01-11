const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    updateProfile,
    getProfile,
    updateCommunityRead,
    getUserCount,
    forgotPassword,
    resetPassword,
    sendRegistrationOtp,
    verifyRegistrationOtp,
    verifyResetOtp,
    searchUsers
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendRegistrationOtp);
router.post('/verify-otp', verifyRegistrationOtp);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.put('/profile', protect, updateProfile);
router.get('/profile', protect, getProfile);
router.put('/read-community', protect, updateCommunityRead);
router.get('/users/count', protect, getUserCount);
router.get('/users', protect, searchUsers);

module.exports = router;
