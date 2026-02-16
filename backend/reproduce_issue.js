const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api/auth';

// Minimal Schema to verify existing documents
const RegistrationOtpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, expires: 600 } // TTL index
});
const RegistrationOtp = mongoose.model('RegistrationOtp', RegistrationOtpSchema);

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true },
    isVerified: { type: Boolean, default: false } // The field we care about
}, { strict: false }); // Allow other fields
const User = mongoose.model('User', UserSchema);

async function testSignup() {
    try {
        const email = `testuser_${Date.now()}@gmail.com`;
        const payload = {
            name: 'Test Verify',
            email,
            password: 'Password123!',
            phone: '1234567890',
            role: 'user',
            cnic: '1234567890123', // Assuming required
            propertyType: 'house',
            ownership: 'owner'
        };

        console.log(`Connecting to DB: ${process.env.MONGO_URI}`);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB.');

        // 1. Inject Verified OTP
        console.log('Injecting verified OTP record...');
        await RegistrationOtp.findOneAndUpdate(
            { email },
            { email, otp: '123456', isVerified: true, expiresAt: Date.now() + 600000 },
            { upsert: true, new: true }
        );
        console.log('Injected verified OTP record.');

        // 2. Register via API
        console.log('Attempting signup via API...');
        const res = await axios.post(`${API_URL}/signup`, payload);
        console.log('Signup API Response:', res.status, res.data);

        // 3. Check Database for User
        console.log('Checking User in DB...');
        const user = await User.findOne({ email });

        if (!user) {
            console.error('FAILURE: User not found in DB!');
            return;
        }

        console.log('User created in DB:', user.email);
        console.log('User isVerified status:', user.isVerified);

        if (user.isVerified === false) {
            console.log('SUCCESS: User is NOT verified by default.');
        } else {
            console.log('FAILURE: User IS verified by default!');
        }

    } catch (error) {
        console.error('Error:', error.response ? JSON.stringify(error.response.data) : error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testSignup();
