const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    consumerId: { type: String, required: true, index: true }, // IESCO/SNGPL Consumer ID or internal ID
    type: { type: String, required: true }, // electricity, gas, maintenance
    provider: { type: String, required: true }, // IESCO, SNGPL, Urban Ease Residency
    billId: { type: String, required: true, unique: true }, // Printable Bill ID (EB-..., GB-...)
    referenceId: { type: String, required: true, unique: true }, // CRITICAL: Payment Reference
    amount: { type: Number, required: true },
    dueDate: { type: String, required: true },
    billingMonth: { type: String, required: true }, // December 2025

    // Type Specific Fields
    status: { type: String, enum: ['paid', 'due', 'upcoming', 'failed'], default: 'due' },
    meterReading: {
        previous: { type: Number },
        current: { type: Number }
    },
    unitsConsumed: { type: Number },
    flatNumber: { type: String }, // For Maintenance
    consumerName: { type: String }, // Name on bill
    address: { type: String },

    // Payment Data
    method: { type: String }, // JazzCash, EasyPaisa
    payerPhone: { type: String },
    paidDate: { type: Date },
    transactionId: { type: String },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bill', billSchema);
