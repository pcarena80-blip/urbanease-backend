const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema({
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        index: true
    },
    event: {
        type: String,
        required: true,
        enum: ['created', 'initiated', 'success', 'failed', 'cancelled', 'webhook_received', 'webhook_verified', 'webhook_failed']
    },
    data: {
        type: Object
    },
    error: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('PaymentLog', paymentLogSchema);
