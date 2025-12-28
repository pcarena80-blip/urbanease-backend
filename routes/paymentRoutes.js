const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createPaymentTransaction,
    handleWebhook,
    getPaymentStatus,
    getPaymentHistory,
    handleReturn,
    simulatePayment,
    initiatePayment
} = require('../controllers/paymentController');

// Protected routes (require authentication)
router.post('/create', protect, createPaymentTransaction);
router.post('/initiate', protect, initiatePayment); // Legacy route
router.get('/status/:orderId', protect, getPaymentStatus);
router.get('/history', protect, getPaymentHistory);

// Public routes (called by payment aggregator)
router.post('/webhook', handleWebhook); // No auth - aggregator calls this
router.get('/return', handleReturn);
router.get('/cancel', handleReturn); // Same handler for now

// Development/testing routes
if (process.env.NODE_ENV !== 'production') {
    router.post('/simulate', simulatePayment);
}

module.exports = router;
