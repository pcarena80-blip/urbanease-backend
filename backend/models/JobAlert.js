const mongoose = require('mongoose');

const JobAlertSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    salary: { type: String },
    employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'], default: 'Full-time' },
    contactEmail: { type: String },
    contactPhone: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('JobAlert', JobAlertSchema);
