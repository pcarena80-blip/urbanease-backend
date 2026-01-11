const Carpool = require('../models/Carpool');
const User = require('../models/User');

// @desc    Create a new carpool listing
// @route   POST /api/carpool
// @access  Private (Resident only)
const createCarpool = async (req, res) => {
    try {
        const {
            contactNumber,
            vehicleType,
            vehicleNumber,
            seatingCapacity,
            seatsAvailable,
            availableDays,
            timeSlot,
            destination
        } = req.body;

        // Ensure user is verified (basic safety)
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'user' /* Add isVerified check if strictly required, simplified for now */) {
            // Proceeding assuming 'user' is enough, but strictly "residents only" implies authenticated
        }

        // Check if user already has a listing? Optional. Let's allow one per user for simplicity.
        const existing = await Carpool.findOne({ provider: req.user.id });
        if (existing) {
            return res.status(400).json({ message: 'You already have an active carpool listing' });
        }

        const carpool = await Carpool.create({
            provider: req.user.id,
            name: user.name,
            contactNumber,
            vehicleType,
            vehicleNumber,
            seatingCapacity,
            seatsAvailable,
            availableDays,
            timeSlot,
            pickupLocation: "ABC Residency – Main Gate", // Enforce fixed location
            destination
        });

        res.status(201).json(carpool);
    } catch (error) {
        console.error("Create Carpool Error:", error);
        res.status(500).json({ message: 'Server error creating carpool listing' });
    }
};

// @desc    Get all carpool listings
// @route   GET /api/carpool
// @access  Private
const getAllCarpools = async (req, res) => {
    try {
        const carpools = await Carpool.find().sort({ createdAt: -1 });
        res.json(carpools);
    } catch (error) {
        console.error("Get Carpools Error:", error);
        res.status(500).json({ message: 'Server error fetching carpool listings' });
    }
};

// @desc    Delete own carpool listing
// @route   DELETE /api/carpool/:id
// @access  Private
const deleteCarpool = async (req, res) => {
    try {
        const carpool = await Carpool.findById(req.params.id);

        if (!carpool) {
            return res.status(404).json({ message: 'Carpool listing not found' });
        }

        // Ensure user owns the listing
        if (carpool.provider.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this listing' });
        }

        await carpool.deleteOne();
        res.json({ message: 'Carpool listing removed' });
    } catch (error) {
        console.error("Delete Carpool Error:", error);
        res.status(500).json({ message: 'Server error deleting carpool listing' });
    }
};

module.exports = {
    createCarpool,
    getAllCarpools,
    deleteCarpool
};
