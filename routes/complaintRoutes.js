const express = require('express');
const router = express.Router();
const {
    getComplaints,
    createComplaint,
    updateComplaint,
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.route('/').get(protect, getComplaints).post(protect, upload.single('image'), createComplaint);
router.route('/:id').put(protect, updateComplaint);

module.exports = router;
