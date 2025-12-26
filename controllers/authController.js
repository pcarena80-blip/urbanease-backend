const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Helper functions for validation
const validateEmail = (email) => {
    // Regex for valid email structure and specific domains
    const re = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|yahoo\.com|hotmail\.com|icloud\.com)$/;
    return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
    let { name, fullName, email, phone, password } = req.body;

    // Map fullName to name if name is missing (frontend support)
    if (!name && fullName) {
        name = fullName;
    }

    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    email = email.toLowerCase(); // Enforce lowercase

    if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email domain. Allowed: gmail.com, outlook.com, etc.' });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({ message: 'Password must be at least 8 chars, with 1 uppercase, 1 lowercase, 1 number, and 1 special char.' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    try {
        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            cnic: req.body.cnic,
            propertyType: req.body.propertyType,
            ownership: req.body.ownership,
            block: req.body.block,
            street: req.body.street,
            houseNo: req.body.houseNo,
            plazaName: req.body.plazaName,
            floorNumber: req.body.floorNumber,
            flatNumber: req.body.flatNumber,
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                token: generateToken(user.id),
            });
        }
    } catch (error) {
        console.error('Registration Error:', error.message);
        res.status(400).json({ message: 'Invalid user data: ' + error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    let { email, password } = req.body;
    email = email.toLowerCase();

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        // Log login history
        await LoginHistory.create({
            userId: user.id,
        });

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id),
        });
    } else {
        res.status(400).json({ message: 'Invalid credentials' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { password, phone, block, street, houseNo, plazaName, floorNumber, flatNumber } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update Password if provided
        if (password) {
            if (!validatePassword(password)) {
                return res.status(400).json({ message: 'Password must be at least 8 chars, with 1 uppercase, 1 lowercase, 1 number, and 1 special char.' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            console.log(`[DEBUG] Profile Update: Password changed for ${user.email}`);
        }

        // Update Phone
        if (phone) {
            user.phone = phone;
        }

        // Update Address Fields
        if (block || street || houseNo || plazaName || floorNumber || flatNumber) {
            if (block) user.block = block;
            if (street) user.street = street;
            if (houseNo) user.houseNo = houseNo;
            if (plazaName) user.plazaName = plazaName;
            if (floorNumber) user.floorNumber = floorNumber;
            if (flatNumber) user.flatNumber = flatNumber;

            user.isVerified = false; // Set to unverified on address change
        }

        await user.save();

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isVerified: user.isVerified,
            token: generateToken(user.id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified,
                lastCommunityRead: user.lastCommunityRead,
                // Add other fields as needed
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update community chat read timestamp
// @route   PUT /api/auth/read-community
// @access  Private
const updateCommunityRead = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.lastCommunityRead = Date.now();
            await user.save();
            res.json({ success: true, lastCommunityRead: user.lastCommunityRead });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get total user count
// @route   GET /api/auth/users/count
// @access  Private
const getUserCount = async (req, res) => {
    try {
        const count = await User.countDocuments({});
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Forgot Password (Generate OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    let { email } = req.body;
    email = email.toLowerCase();
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        console.log(`[DEV MODE] Password Reset OTP for ${email}: ${otp}`);

        res.json({ message: 'OTP sent to email (Check server console for Dev Mode)' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Reset Password (Verify OTP)
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    let { email, otp, newPassword } = req.body;
    email = email.toLowerCase();
    try {
        const user = await User.findOne({
            email,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        if (!validatePassword(newPassword)) {
            return res.status(400).json({ message: 'Password must be at least 8 chars, with 1 uppercase, 1 lowercase, 1 number, and 1 special char.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        console.log(`[DEBUG] Password reset for ${email}. New Hash: ${user.password}`);

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateProfile,
    getProfile,
    updateCommunityRead,
    getUserCount,
    forgotPassword,
    resetPassword
};
