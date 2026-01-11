const mongoose = require('mongoose');

const carpoolSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: { // Snapshot of provider name for easier display
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    vehicleType: {
        type: String,
        required: true,
        enum: ['Car', 'Bike', 'Van', 'Other']
    },
    vehicleNumber: {
        type: String,
        required: true
    },
    seatingCapacity: {
        type: Number,
        required: true
    },
    seatsAvailable: {
        type: Number,
        required: true
    },
    availableDays: {
        type: [String], // ['Mon', 'Tue', ...]
        required: true
    },
    timeSlot: {
        type: String,
        required: true // e.g., "Morning", "Evening", or "08:00 AM"
    },
    pickupLocation: {
        type: String,
        required: true,
        default: 'ABC Residency – Main Gate' // Fixed as per requirements
    },
    destination: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Carpool', carpoolSchema);
