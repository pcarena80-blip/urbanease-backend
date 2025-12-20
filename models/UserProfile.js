const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    address: { type: String, default: '' },
    contactInfo: { type: String, default: '' },
    profilePicture: { type: String, default: '' }, // URL to image
    additionalInfo: { type: String, default: '' }
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
