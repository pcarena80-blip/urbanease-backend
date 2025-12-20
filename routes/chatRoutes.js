const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.get('/inbox', protect, require('../controllers/chatController').getInbox);
router.get('/:userId', protect, getMessages);
router.post('/', protect, upload.single('file'), sendMessage);

module.exports = router;
