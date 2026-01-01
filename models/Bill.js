const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true }, // e.g., Electricity, Water, Gas, Internet
    amount: { type: Number, required: true },
    dueDate: { type: String, required: true }, // Keeping as string for 'DD MMM YYYY' format simplicity or Date
    month: { type: String, required: true }, // e.g., "January 2024"
    refNo: { type: String, required: true, unique: true },
    status: { type: String, enum: ['paid', 'due', 'upcoming'], default: 'due' },
    method: { type: String }, // e.g., "Credit Card", "Bank Transfer"
    paidDate: { type: Date },
    generatedDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bill', billSchema);
