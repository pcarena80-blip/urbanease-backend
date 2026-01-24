const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: String, required: true, index: true }, // Changed to String to support 'community' and other String IDs
    message: { type: String, required: false }, // Made optional if sending only attachment
    attachment: { type: String }, // Path to file
    attachmentType: { type: String, enum: ['image', 'file'] },
    timestamp: { type: Date, default: Date.now, index: true }
});

// Compound index for chat queries
chatMessageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
chatMessageSchema.index({ receiverId: 1, timestamp: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
