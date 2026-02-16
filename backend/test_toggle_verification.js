const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api/admin';
// We need a token. Let's assume there's a way to get one or we can bypass auth for valid testing if we use a superadmin or if we mock the middleware.
// Actually, adminRoutes requires 'protect' and 'adminMiddleware'.
// I need to login as an admin first to get a token.

// Let's create a temporary admin user if one doesn't exist, login, get token, then test verify/unverify.

async function testToggleVerification() {
    try {
        console.log(`Connecting to DB: ${process.env.MONGO_URI}`);
        await mongoose.connect(process.env.MONGO_URI);

        const User = require('./models/User');

        // 1. Create/Find Admin User
        const adminEmail = 'admin_test@test.com';
        const adminPassword = 'password123';

        let admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            const salt = await require('bcryptjs').genSalt(10);
            const hashedPassword = await require('bcryptjs').hash(adminPassword, salt);
            admin = await User.create({
                name: 'Test Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isVerified: true
            });
            console.log('Created Test Admin');
        } else {
            // ensure role is admin
            if (admin.role !== 'admin') {
                admin.role = 'admin';
                await admin.save();
            }
        }

        // 2. Login as Admin
        console.log('Logging in as Admin...');
        const loginRes = await axios.post(`http://localhost:5000/api/auth/login`, {
            email: adminEmail,
            password: adminPassword
        });
        const token = loginRes.data.token;
        console.log('Got Admin Token');

        // 3. Create a Target User
        const targetEmail = `target_${Date.now()}@test.com`;
        const targetUser = await User.create({
            name: 'Target User',
            email: targetEmail,
            password: 'password',
            role: 'user',
            isVerified: false // Start unverified
        });
        console.log(`Created Target User: ${targetUser._id} (isVerified: false)`);

        // 4. Verify User (Old way - implicit true)
        // Actually, my code defaults to true if body is missing, so let's test explicit
        console.log('Verifying User (setting true)...');
        await axios.put(`${API_URL}/users/${targetUser._id}/verify`,
            { isVerified: true },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        let checkedUser = await User.findById(targetUser._id);
        console.log(`User status after Verify: ${checkedUser.isVerified}`);
        if (checkedUser.isVerified !== true) throw new Error('Failed to verify user');

        // 5. Unverify User (New feature)
        console.log('Unverifying User (setting false)...');
        await axios.put(`${API_URL}/users/${targetUser._id}/verify`,
            { isVerified: false },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        checkedUser = await User.findById(targetUser._id);
        console.log(`User status after Unverify: ${checkedUser.isVerified}`);
        if (checkedUser.isVerified !== false) throw new Error('Failed to unverify user');

        console.log('SUCCESS: Verification Toggling Works!');

        // Cleanup
        await User.deleteOne({ email: adminEmail });
        await User.deleteOne({ email: targetEmail });

    } catch (error) {
        console.error('Error:', error.response ? JSON.stringify(error.response.data) : error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testToggleVerification();
