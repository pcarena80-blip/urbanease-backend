const express = require('express');
const router = express.Router();
const {
    requestComplaintModule,
    submitComplaint,
    updateComplaint,
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.route('/').get(protect, requestComplaintModule).post(protect, upload.single('image'), submitComplaint);
router.route('/:id').put(protect, updateComplaint);

module.exports = router;
