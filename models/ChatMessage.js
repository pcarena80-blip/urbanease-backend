const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: String, required: true }, // Changed to String to support 'community' and other String IDs
    message: { type: String, required: false }, // Made optional if sending only attachment
    attachment: { type: String }, // Path to file
    attachmentType: { type: String, enum: ['image', 'file'] },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
