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
    verifyResetOtp
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendRegistrationOtp); // New
router.post('/verify-otp', verifyRegistrationOtp); // New
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp); // New
router.post('/reset-password', resetPassword);
router.put('/profile', protect, updateProfile);
router.get('/profile', protect, getProfile);
router.put('/read-community', protect, updateCommunityRead);
router.get('/users/count', protect, getUserCount);

module.exports = router;
