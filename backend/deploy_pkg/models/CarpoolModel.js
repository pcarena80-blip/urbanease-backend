const mongoose = require('mongoose');
// Schema Force Update v2

console.log("=== LOADING CARPOOL MODEL V3 (DEBUG) ===");
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
        enum: ['Car', 'Jeep', 'SUV']
    },
    vehicleName: {
        type: String,
        required: true
    },
    vehicleNumber: {
        type: String,
        required: true
    },
    seatingCapacity: {
        type: Number,
        required: true,
        max: 4 // Enforce max 4 seats
    },
    seatsAvailable: {
        type: Number,
        required: true,
        max: 4
    },
    // Trip type: one-way (going only) or two-way (going and returning)
    tripType: {
        type: String,
        enum: ['one-way', 'two-way'],
        required: true,
        default: 'two-way'
    },
    // Schedule with going times, return times optional for one-way trips
    schedule: {
        type: [{
            day: { type: String, required: true },
            goingTime: { type: String, required: true },
            goingPeriod: { type: String, enum: ['AM', 'PM'], required: true },
            // Return times are optional (only used for two-way trips)
            returnTime: { type: String, required: false },
            returnPeriod: { type: String, enum: ['AM', 'PM'], required: false }
        }],
        required: true
    },
    pickupLocation: {
        type: String,
        required: true,
        default: 'Urban E Society' // Fixed departure location
    },
    destination: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index for faster sorting
carpoolSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Carpool', carpoolSchema);
