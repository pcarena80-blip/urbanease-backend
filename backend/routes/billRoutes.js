const express = require('express');
const router = express.Router();
const { getAllBills, generateBill, payBill } = require('../controllers/billController');

router.route('/').get(getAllBills);
router.route('/generate').post(generateBill); // New Flow
router.route('/pay').post(payBill);

module.exports = router;
