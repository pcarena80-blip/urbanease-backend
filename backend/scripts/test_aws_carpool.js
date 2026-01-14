const axios = require('axios');

const BASE_URL = 'http://51.20.34.254:5000/api';

const testCarpool = async () => {
    try {
        console.log('1. Registering/Logging in test user...');
        const email = `debug_${Date.now()}@test.com`;
        const password = 'Password@123'; // Strong password

        let token;
        let userId;

        try {
            const regRes = await axios.post(`${BASE_URL}/auth/signup`, {
                name: 'Debug User',
                email,
                password,
                phone: '+923001234567',
                role: 'resident'
            });
            token = regRes.data.token;
            userId = regRes.data._id;
            console.log('   Registered:', email);
        } catch (e) {
            console.log('   Registration failed (maybe exists), trying login...');
            if (e.response) {
                console.error('   Reg Error:', e.response.status, e.response.data);
            } else {
                console.error('   Reg Error (No Response):', e.message);
            }
            return;
        }

        console.log('2. Creating Carpool...');
        const carpoolData = {
            contactNumber: '+923001234567',
            vehicleType: 'Car',
            vehicleName: 'Honda Civic',
            vehicleNumber: 'ABC-123',
            seatingCapacity: 4,
            seatsAvailable: 3,
            pickupLocation: 'Urban E Society',
            destination: 'DHA Phase 6',
            tripType: 'one-way', // Testing one-way
            schedule: [
                {
                    day: 'Monday',
                    goingTime: '08:00',
                    goingPeriod: 'AM'
                }
            ]
        };

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        const res = await axios.post(`${BASE_URL}/carpool`, carpoolData, config);
        console.log('✅ SUCCESS! Carpool Created:', res.data);

    } catch (error) {
        console.error('❌ FAILED!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
};

testCarpool();
