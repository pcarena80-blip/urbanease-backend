const express = require('express');
const router = express.Router();
const { requestEditProfileForm, submitProfileChanges, getUserProfileById } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, requestEditProfileForm).put(protect, submitProfileChanges);
router.get('/:id', protect, getUserProfileById);

module.exports = router;
