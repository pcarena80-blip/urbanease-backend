const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true },
    category: { type: String, enum: ['General', 'Maintenance', 'Security', 'Noise', 'Cleanliness', 'Water Supply', 'Electricity', 'Garbage Collection', 'Noise Complaint', 'Other'], default: 'General' },
    description: { type: String, required: true },
    image: { type: String }, // Path to the uploaded image
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    status: { type: String, enum: ['pending', 'in-progress', 'resolved', 'rejected'], default: 'pending', index: true },
    response: { type: String }, // Admin response
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date }
});

module.exports = mongoose.model('Complaint', complaintSchema);
