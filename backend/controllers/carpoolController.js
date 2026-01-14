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
            vehicleName,
            vehicleNumber,
            seatingCapacity,
            seatsAvailable,
            schedule,
            pickupLocation,
            destination,
            tripType
        } = req.body;

        console.log('[DEBUG] Create Carpool Request Body:', JSON.stringify(req.body));

        const user = await User.findById(req.user.id);

        if (seatingCapacity > 4) {
            return res.status(400).json({ message: 'Seating capacity cannot exceed 4' });
        }
        if (seatsAvailable > seatingCapacity) {
            return res.status(400).json({ message: 'Available seats cannot exceed capacity' });
        }

        // Multiple carpools per user now allowed

        const carpool = await Carpool.create({
            provider: req.user.id,
            name: user.name,
            contactNumber,
            vehicleType,
            vehicleName,
            vehicleNumber,
            seatingCapacity,
            seatsAvailable,
            schedule,
            pickupLocation,
            destination,
            tripType // Add tripType to creation
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
        console.log('[DEBUG] getAllCarpools request received');
        const carpools = await Carpool.find().sort({ createdAt: -1 });
        console.log(`[DEBUG] Found ${carpools.length} carpools`);
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
