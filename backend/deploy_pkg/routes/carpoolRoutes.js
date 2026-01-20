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
    .get(getAllCarpools); // Temporarily made public for debugging/fix

router.route('/:id')
    .delete(protect, deleteCarpool);

module.exports = router;
