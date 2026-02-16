const mongoose = require('mongoose');

const messageReportSchema = new mongoose.Schema({
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage', required: true },
    messageContent: { type: String },         // snapshot of the message text
    reason: {
        type: String,
        enum: ['inappropriate', 'spam', 'harassment', 'other'],
        required: true
    },
    description: { type: String },            // optional extra detail from reporter
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'dismissed'],
        default: 'pending'
    }
}, { timestamps: true });

messageReportSchema.index({ reporterId: 1, messageId: 1 }, { unique: true }); // prevent duplicate reports
messageReportSchema.index({ status: 1 });

module.exports = mongoose.model('MessageReport', messageReportSchema);
