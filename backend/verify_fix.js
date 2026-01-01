const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
// const request = require('supertest'); 
// Actually, let's just use fetch if node 18+ or axios if available. package.json had axios? No, frontend had axios.
// Backend has express. I can just use `require('http')` or `fetch` (Node 18+).

dotenv.config();

const BASE_URL = 'http://127.0.0.1:5000/api';

async function verify() {
    // 1. Connect DB to find a user or create one
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/urbanease');

    let user = await User.findOne({ email: 'test@urbanease.com' });
    if (!user) {
        console.log('Creating test user...');
        // Create user logic manually to ensure password matches '123456'
        // But hashing... 
        // Better to use the Registration API to create a user!
    }

    // Start Server? No, I assume server is running. 
    // Wait, I need to start the server first in a separate terminal.

    // So this script will just be a CLIENT.

    try {
        console.log('1. Attempting Login...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@urbanease.com', // Try a common email or I should create one
                password: 'password123'
            })
        });

        // If login fails, try to REGISTER a new temp user
        let token;
        if (loginRes.status !== 200) {
            console.log('Login failed (expected if user missing). Registering new test user...');
            const regRes = await fetch(`${BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Verify',
                    email: `verify_${Date.now()}@gmail.com`,
                    password: 'Password@123',
                    phone: '03001234567'
                })
            });
            const regData = await regRes.json();
            if (regRes.status !== 201) {
                console.error('Registration Failed:', regData);
                process.exit(1);
            }
            token = regData.token;
            console.log('Registration Successful. Token obtained.');
        } else {
            const loginData = await loginRes.json();
            token = loginData.token;
            console.log('Login Successful.');
        }

        // 2. Test Profile
        console.log('2. Testing Profile API...');
        const profileRes = await fetch(`${BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (profileRes.status === 200) {
            console.log('✅ SUCCESS: Profile API returned 200 OK');
            const profileData = await profileRes.json();
            console.log('User:', profileData.email);
        } else {
            console.error('❌ FAILURE: Profile API returned', profileRes.status);
            const text = await profileRes.text();
            console.error('Response:', text);
            process.exit(1);
        }

        process.exit(0);

    } catch (err) {
        console.error('Network Error (Is server running?):', err.message);
        process.exit(1);
    }
}

verify();
