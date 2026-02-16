const express = require('express');
const router = express.Router();
const { displayChatWindow, deliverMessage, requestChatCenter, markAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

// Unread message routes (must be before /:userId to avoid conflict)
router.get('/unread', protect, requestChatCenter);
router.post('/read/:chatId', protect, markAsRead);

router.get('/inbox', protect, require('../controllers/chatController').getInbox);
router.get('/reports', protect, require('../controllers/chatController').getReportedMessages); // Must be before /:userId

// Chat Request Routes
router.post('/request', protect, require('../controllers/chatController').sendRequest);
router.get('/requests', protect, require('../controllers/chatController').getRequests);
router.put('/request/:requestId', protect, require('../controllers/chatController').respondToRequest);
router.get('/status/:userId', protect, require('../controllers/chatController').getChatStatus);

router.get('/:userId', protect, displayChatWindow);
router.post('/', protect, upload.single('file'), deliverMessage);
router.delete('/:id', protect, require('../controllers/chatController').deleteMessage);

// Report a message
const MessageReport = require('../models/MessageReport');
const ChatMessage = require('../models/ChatMessage');
router.post('/report', protect, async (req, res) => {
    try {
        const { messageId, reason, description } = req.body;
        const reporterId = req.user._id;

        if (!messageId || !reason) {
            return res.status(400).json({ message: 'messageId and reason are required' });
        }

        // Verify the message exists
        const message = await ChatMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Cannot report your own message
        if (message.senderId.toString() === reporterId.toString()) {
            return res.status(400).json({ message: 'Cannot report your own message' });
        }

        // Check for duplicate report
        const existing = await MessageReport.findOne({ reporterId, messageId });
        if (existing) {
            return res.status(409).json({ message: 'You have already reported this message' });
        }

        const report = await MessageReport.create({
            reporterId,
            reportedUserId: message.senderId,
            messageId,
            messageContent: message.message || '',
            reason,
            description: description || ''
        });

        res.status(201).json({ message: 'Message reported successfully', reportId: report._id });
    } catch (error) {
        console.error('Report message error:', error);
        res.status(500).json({ message: 'Failed to report message' });
    }
});

module.exports = router;

