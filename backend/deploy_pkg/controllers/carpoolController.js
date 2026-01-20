const Carpool = require('../models/CarpoolModel');
const User = require('../models/User');

// @desc    Create a new carpool listing
// @route   POST /api/carpool
// @access  Private (Resident only)
const createCarpool = async (req, res) => {
    console.log('[CARPOOL] Create request received'); // Log entry
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

        // 1. Validate User
        if (!req.user || !req.user.id) {
            console.error('[CARPOOL ERROR] User ID missing in request');
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            console.error(`[CARPOOL ERROR] User not found for ID: ${req.user.id}`);
            return res.status(404).json({ message: 'User profile not found' });
        }

        // 2. Validate Data
        if (seatingCapacity > 4) {
            return res.status(400).json({ message: 'Seating capacity cannot exceed 4' });
        }
        if (seatsAvailable > seatingCapacity) {
            return res.status(400).json({ message: 'Available seats cannot exceed capacity' });
        }

        // 3. Create Entry
        console.log(`[CARPOOL] Creating listing for user: ${user.name} (${user._id})`);

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
            tripType
        });

        console.log(`[CARPOOL] Created successfully: ${carpool._id}`);
        res.status(201).json(carpool);

    } catch (error) {
        console.error("Create Carpool CRITICAL Error:", error);
        // Return DETAILED error to client even in production for this specific endpoint
        // to help debug the P0 incident.
        res.status(500).json({
            message: `Server Error: ${error.message}`,
            details: error.toString()
        });
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
