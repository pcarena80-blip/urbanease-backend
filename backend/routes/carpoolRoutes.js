const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createCarpool,
    getAllCarpools,
    deleteCarpool
} = require('../controllers/carpoolController');

router.route('/')
    .post(protect, createCarpool)
    .get(protect, getAllCarpools);

router.route('/:id')
    .delete(protect, deleteCarpool);

module.exports = router;
