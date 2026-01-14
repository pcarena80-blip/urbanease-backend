const axios = require('axios');
const BASE_URL = 'http://51.20.34.254:5000/api';

const testCarpool = async () => {
    const email = `debug_${Date.now()}@test.com`;
    // We reuse a fixed email if we ran before? No, random is safer for Reg.
    // BUT we need to target the SAME user for Verify step.
    // Strategy:
    // Run 1: Random Email -> Registers -> Fails 400 (Unverified).
    // Run 2: Verify Last User script.
    // Run 3: Login SAME Email? -> No, we don't know the email from Run 1 easily unless we hardcode.
    // BETTER: Hardcode Email.
    const FIXED_EMAIL = 'debug_db_user@test.com';
    const PASSWORD = 'Password@123';

    try {
        console.log('1. Registering...');
        await axios.post(`${BASE_URL}/auth/signup`, {
            name: 'Debug User',
            email: FIXED_EMAIL,
            password: PASSWORD,
            phone: '+923001234567',
            role: 'resident'
        });
        console.log('   Registered!');
    } catch (e) {
        console.log('   Registration skipped/failed (expected if exists).');
    }

    let token;
    try {
        console.log('2. Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: FIXED_EMAIL,
            password: PASSWORD
        });
        token = loginRes.data.token;
        console.log('   Logged In!');
    } catch (e) {
        console.log('❌ Login Failed (User likely unverified).');
        console.log('   Run "node scripts/verify_last_user.js" then Retry.');
        // console.log(e.response ? e.response.data : e.message);
        return;
    }

    console.log('3. Creating Carpool...');
    try {
        const carpoolData = {
            contactNumber: '+923001234567',
            vehicleType: 'Car',
            vehicleName: 'Honda Civic',
            vehicleNumber: 'ABC-123',
            seatingCapacity: 4,
            seatsAvailable: 3,
            pickupLocation: 'Urban E Society',
            destination: 'DHA Phase 6',
            tripType: 'one-way',
            schedule: [{ day: 'Monday', goingTime: '08:00', goingPeriod: 'AM' }]
        };
        const res = await axios.post(`${BASE_URL}/carpool`, carpoolData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ SUCCESS! Carpool Created:', res.data);
    } catch (error) {
        console.error('❌ FAILED! SERVER RESPONSE:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
};

testCarpool();
