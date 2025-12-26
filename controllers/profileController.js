const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Construct Address based on Property Type
        let formattedAddress = 'N/A';
        if (user.propertyType === 'house') {
            if (user.houseNo && user.street && user.block) {
                formattedAddress = `House ${user.houseNo}, Street ${user.street}, Block ${user.block}`;
            }
        } else if (user.propertyType === 'apartment') {
            if (user.flatNumber && user.plazaName) {
                formattedAddress = `Flat ${user.flatNumber}, ${user.floorNumber ? user.floorNumber + ', ' : ''}${user.plazaName}`;
            }
        } else {
            formattedAddress = user.address || 'N/A';
        }

        const formattedProfile = {
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: formattedAddress,
            propertyType: user.propertyType,
            block: user.block,
            street: user.street,
            houseNo: user.houseNo,
            plazaName: user.plazaName,
            floorNumber: user.floorNumber,
            flatNumber: user.flatNumber,
            isVerified: user.isVerified
        };

        res.status(200).json(formattedProfile);
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user profile by ID
// @route   GET /api/profile/:id
// @access  Private
const getUserProfileById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Construct Address based on Property Type (Reuse logic or simplify)
        let formattedAddress = 'N/A';
        if (user.propertyType === 'house') {
            if (user.houseNo && user.street && user.block) {
                formattedAddress = `House ${user.houseNo}, Street ${user.street}, Block ${user.block}`;
            }
        } else if (user.propertyType === 'apartment') {
            if (user.flatNumber && user.plazaName) {
                formattedAddress = `Flat ${user.flatNumber}, ${user.floorNumber ? user.floorNumber + ', ' : ''}${user.plazaName}`;
            }
        } else {
            formattedAddress = user.address || 'N/A';
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email, // Maybe hide email/phone for privacy? User didn't specify. Assuming visible for community.
            phone: user.phone,
            address: formattedAddress,
            propertyType: user.propertyType,
            isVerified: user.isVerified
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
    // We need to update the User model, not just UserProfile if we want to change phone/address
    // because those fields are stored on User (and mirrored/populated).

    // However, the original implementation might have been trying to update UserProfile.
    // Given the schema, User stores properly structured address/phone.
    // So we should update User here too.

    const userId = req.user.id;
    const { phone, block, street, houseNo, plazaName, floorNumber, flatNumber, propertyType, password, oldPassword } = req.body;


    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update Password with Old Password Verification
        if (password) {
            if (!oldPassword) {
                return res.status(400).json({ message: 'Old password is required to set a new password' });
            }
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Incorrect old password' });
            }
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(password, salt);
            user.password = newHash;
            console.log(`[DEBUG] Profile Controller: Password updated for user ${userId}. New Hash Prefix: ${newHash.substring(0, 10)}`);
        }

        // Update Phone
        if (phone) user.phone = phone;

        // Update Property Type (if allowed)
        if (propertyType) user.propertyType = propertyType;

        // Update Address Fields
        if (block || street || houseNo || plazaName || floorNumber || flatNumber) {
            if (block) user.block = block;
            if (street) user.street = street;
            if (houseNo) user.houseNo = houseNo;
            if (plazaName) user.plazaName = plazaName;
            if (floorNumber) user.floorNumber = floorNumber;
            if (flatNumber) user.flatNumber = flatNumber;

            user.isVerified = false;
        }

        await user.save();
        console.log(`[DEBUG] Profile Controller: User saved successfully for ${userId}`);

        // Also update UserProfile if needed (currently it just links to user)
        let profile = await UserProfile.findOne({ userId });
        if (!profile) {
            profile = await UserProfile.create({ userId });
        }

        // Re-fetch populated profile to return formatted response
        // Reuse getProfile logic or just return updated user fields?
        // getProfile logic is robust. Let's redirect to that or mimic it.
        const populatedProfile = await UserProfile.findOne({ userId }).populate('userId', 'name email phone propertyType block street houseNo plazaName floorNumber flatNumber address');

        const updatedUser = populatedProfile.userId;
        let formattedAddress = 'N/A';
        if (updatedUser.propertyType === 'house') {
            if (updatedUser.houseNo && updatedUser.street && updatedUser.block) {
                formattedAddress = `House ${updatedUser.houseNo}, Street ${updatedUser.street}, Block ${updatedUser.block}`;
            }
        } else if (updatedUser.propertyType === 'apartment') {
            if (updatedUser.flatNumber && updatedUser.plazaName) {
                formattedAddress = `Flat ${updatedUser.flatNumber}, ${updatedUser.floorNumber ? updatedUser.floorNumber + ', ' : ''}${updatedUser.plazaName}`;
            }
        } else {
            formattedAddress = updatedUser.address || 'N/A';
        }

        const formattedProfile = {
            ...populatedProfile.toObject(),
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            address: formattedAddress,
            propertyType: updatedUser.propertyType,
            block: updatedUser.block,
            street: updatedUser.street,
            houseNo: updatedUser.houseNo,
            plazaName: updatedUser.plazaName,
            floorNumber: updatedUser.floorNumber,
            flatNumber: updatedUser.flatNumber
        };

        res.status(200).json(formattedProfile);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getUserProfileById
};
