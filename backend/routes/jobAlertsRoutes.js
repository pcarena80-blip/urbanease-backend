const express = require('express');
const router = express.Router();
const {
    createJobAlert,
    getAllJobAlerts,
    getMyJobAlerts,
    getJobAlertById,
    updateJobAlert,
    deleteJobAlert
} = require('../controllers/jobAlertsController');
const { protect } = require('../middleware/authMiddleware'); // Assuming this exists

// Public routes (or semi-public depending on requirements, let's keep getAll public and others protected for now)
router.get('/', getAllJobAlerts);
router.get('/:id', getJobAlertById);

// Protected routes
router.use(protect); // All routes below this will require authentication

router.post('/', createJobAlert);
router.get('/user/me', getMyJobAlerts); // specific route for user's own alerts
router.put('/:id', updateJobAlert);
router.delete('/:id', deleteJobAlert);

module.exports = router;
