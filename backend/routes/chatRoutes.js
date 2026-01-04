const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, getUnreadCounts, markAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

// Unread message routes (must be before /:userId to avoid conflict)
router.get('/unread', protect, getUnreadCounts);
router.post('/read/:chatId', protect, markAsRead);

router.get('/inbox', protect, require('../controllers/chatController').getInbox);
router.get('/:userId', protect, getMessages);
router.post('/', protect, upload.single('file'), sendMessage);
router.delete('/:id', protect, require('../controllers/chatController').deleteMessage);

module.exports = router;

