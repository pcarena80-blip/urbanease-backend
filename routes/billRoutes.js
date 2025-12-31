const express = require('express');
const router = express.Router();
const { getAllBills, getBillById, updateBill } = require('../controllers/billController');
// const { protect } = require('../middleware/authMiddleware');

// Temporarily disabling auth middleware for debugging if it's missing
// router.route('/').get(protect, getAllBills);
router.route('/').get(getAllBills);
router.route('/:id').get(getBillById).put(updateBill);

module.exports = router;
