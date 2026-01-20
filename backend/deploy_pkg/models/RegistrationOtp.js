const mongoose = require('mongoose');

const registrationOtpSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isVerified: { type: Boolean, default: false }
}, { timestamps: true });

// TTL index to automatically delete expired documents
registrationOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RegistrationOtp', registrationOtpSchema);
