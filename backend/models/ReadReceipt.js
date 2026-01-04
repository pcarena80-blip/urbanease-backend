const mongoose = require('mongoose');

const readReceiptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chatId: {
        type: String,  // 'community' or recipientUserId
        required: true
    },
    lastReadMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage'
    },
    lastReadAt: {
        type: Date,
        default: Date.now
    }
});

// Unique index for fast lookups
readReceiptSchema.index({ userId: 1, chatId: 1 }, { unique: true });

module.exports = mongoose.model('ReadReceipt', readReceiptSchema);
