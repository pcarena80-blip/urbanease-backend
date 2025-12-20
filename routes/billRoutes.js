const express = require('express');
const router = express.Router();
const {
    getBills,
    setBill,
    updateBill,
    deleteBill,
} = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getBills).post(protect, setBill);
router.route('/:id').put(protect, updateBill).delete(protect, deleteBill);

module.exports = router;
