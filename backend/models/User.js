const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    cnic: { type: String },
    propertyType: { type: String, enum: ['house', 'apartment'], default: 'house' },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user', index: true },
    ownership: { type: String, enum: ['owner', 'tenant'], default: 'owner' },
    // House specific
    block: { type: String },
    street: { type: String },
    houseNo: { type: String },
    // Apartment specific
    plazaName: { type: String },
    floorNumber: { type: String },
    flatNumber: { type: String },
    isVerified: { type: Boolean, default: false, index: true }, // Default unverified, verified after admin check
    isChatBlocked: { type: Boolean, default: false }, // Admin can block user from sending chat messages
    lastCommunityRead: { type: Date, default: Date.now },
    registrationDate: { type: Date, default: Date.now },
    otp: { type: String },
    otpExpires: { type: Date }
});

module.exports = mongoose.model('User', userSchema);
