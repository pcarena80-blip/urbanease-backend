const express = require('express');
const router = express.Router();
const { getAllBills, dispatchBills, payBill, getBillById } = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getAllBills);
router.route('/dispatch').post(dispatchBills); // Admin only (add admin protect later if needed)
router.route('/pay').post(payBill);
router.route('/:id').get(protect, getBillById);

module.exports = router;
