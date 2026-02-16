const mongoose = require('mongoose');

const chatRequestSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
        index: true
    },
    message: { type: String }, // Optional initial message
}, { timestamps: true });

// Ensure unique pending request between two users
chatRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

module.exports = mongoose.model('ChatRequest', chatRequestSchema);
