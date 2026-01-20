const mongoose = require('mongoose');

const noticeSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true
});

noticeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
