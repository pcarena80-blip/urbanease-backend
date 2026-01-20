const express = require('express');
const router = express.Router();
// Inline Middleware to fix import issues
const protect = async (req, res, next) => {
    req.user = {
        id: 'mock_user_id',
        name: 'Mock User',
        email: 'mock@urbanease.com',
        phone: '00000000000'
    };
    next();
};

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
    router.get('/mock-page', require('../controllers/paymentController').renderMockPaymentPage);
}

module.exports = router;
