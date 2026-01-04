const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const RegistrationOtp = require('../models/RegistrationOtp');
const sendEmail = require('../utils/sendEmail');

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

// Helper to generate numeric OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send OTP for Registration
// @route   POST /api/auth/send-otp
// @access  Public
const sendRegistrationOtp = async (req, res) => {
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    email = email.toLowerCase();

    if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email domain' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email already registered. Please login.' });
        }

        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

        // Update or create OTP record
        await RegistrationOtp.findOneAndUpdate(
            { email },
            { email, otp, expiresAt, isVerified: false },
            { upsert: true, new: true }
        );

        const message = `
            <h1>Registration OTP</h1>
            <p>Your OTP for UrbanEase registration is: <h2>${otp}</h2></p>
            <p>This code expires in 10 minutes.</p>
        `;

        const emailSent = await sendEmail({
            email,
            subject: 'UrbanEase Registration OTP',
            message
        });

        if (emailSent) {
            // console.log(`[DEV] OTP for ${email}: ${otp}`); // Keep for fail-safe testing if email fails
            res.json({ message: 'OTP sent successfully' });
        } else {
            console.log(`[DEV FALLBACK] OTP for ${email}: ${otp}`);
            res.json({ message: 'OTP generated (Email failed - Check Console)' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Verify Registration OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyRegistrationOtp = async (req, res) => {
    let { email, otp } = req.body;
    console.log(`[DEBUG] verifyRegistrationOtp called with:`, { email, otp });

    if (!email || !otp) {
        console.log('[DEBUG] Missing email or otp');
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    email = email.toLowerCase();

    try {
        console.log('[DEBUG] Querying RegistrationOtp collection...');
        const record = await RegistrationOtp.findOne({
            email,
            otp,
            expiresAt: { $gt: Date.now() }
        });

        if (!record) {
            console.log('[DEBUG] No matching active OTP record found for:', email);
            // Debug: check if any record exists even if expired or wrong OTP
            const anyRecord = await RegistrationOtp.findOne({ email });
            console.log('[DEBUG] Any record for this email?:', anyRecord);
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        console.log('[DEBUG] Record found, verifying...');
        // Mark as verified
        record.isVerified = true;
        // record.otp = undefined; // KEEP OTP for now to debug if deletion causes issues, but standard is to keep or invalidate
        await record.save();
        console.log('[DEBUG] Email verified successfully');

        res.json({ message: 'Email verified successfully', verified: true });
    } catch (error) {
        console.error('[DEBUG] verifyRegistrationOtp Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register new user (Requires Verified Email)
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
    let { name, fullName, email, phone, password } = req.body;

    if (!name && fullName) name = fullName;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    email = email.toLowerCase();

    // FINAL VALIDATION CHECK
    if (!validatePassword(password)) {
        return res.status(400).json({ message: 'Password must be strong (8+ chars, upper, lower, number, special)' });
    }

    try {
        // Double check email verification status
        const verificationRecord = await RegistrationOtp.findOne({ email, isVerified: true });

        // IMPORTANT: In production, enforce this. For now, if no record exists but we are testing, we might optionally skip. 
        // But user said "No shortcuts". So we ENFORCE.
        if (!verificationRecord) {
            return res.status(400).json({ message: 'Email not verified. Please verify using OTP first.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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
            role: 'user',
            isVerified: true // Auto-verify so they appear in Bills section immediately
        });

        // Cleanup OTP record
        await RegistrationOtp.deleteOne({ email });

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

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        await LoginHistory.create({ userId: user.id });
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
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (password) {
            if (!validatePassword(password)) {
                return res.status(400).json({ message: 'Password too weak' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        if (phone) user.phone = phone;
        if (block || street || houseNo || plazaName || floorNumber || flatNumber) {
            if (block) user.block = block;
            if (street) user.street = street;
            if (houseNo) user.houseNo = houseNo;
            if (plazaName) user.plazaName = plazaName;
            if (floorNumber) user.floorNumber = floorNumber;
            if (flatNumber) user.flatNumber = flatNumber;
            user.isVerified = false; // Reset admin verification on address change
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
                role: user.role, // Added role
                lastCommunityRead: user.lastCommunityRead,
                address: user.block ? `${user.block}, ${user.street}, ${user.houseNo}` : `${user.plazaName}, ${user.floorNumber}, ${user.flatNumber}`
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
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    let { email } = req.body;
    email = email.toLowerCase();
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const message = `
            <h1>Reset Password OTP</h1>
            <p>Your OTP to reset your UrbanEase password is: <h2>${otp}</h2></p>
            <p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        `;

        const emailSent = await sendEmail({
            email,
            subject: 'UrbanEase Password Reset',
            message
        });

        if (emailSent) {
            res.json({ message: 'OTP sent to your email.' });
        } else {
            console.log(`[DEV FALLBACK] Reset OTP for ${email}: ${otp}`);
            res.json({ message: 'OTP generated (Email failed - Check Console)' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Verify Reset OTP (Check if valid before showing password field) - Optional step or combined
const verifyResetOtp = async (req, res) => {
    let { email, otp } = req.body;
    email = email.toLowerCase();

    const user = await User.findOne({
        email,
        otp,
        otpExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP Verified', valid: true });
}

// @desc    Reset Password (Verify OTP + Set Password)
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
            return res.status(400).json({ message: 'Password too weak.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successful. You can now login.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateProfile,
    getProfile,
    updateCommunityRead,
    getUserCount,
    sendRegistrationOtp,
    verifyRegistrationOtp,
    forgotPassword,
    verifyResetOtp,
    resetPassword
};
