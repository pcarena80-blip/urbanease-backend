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
    attachment: {
        type: String,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Notice', noticeSchema);
