const axios = require('axios');

// AWS Production URL
const BASE_URL = 'http://51.20.34.254:5000/api';

const runProbe = async () => {
    console.log(`[PROBE] Starting Carpool Creation Probe targeting: ${BASE_URL}`);

    try {
        // 1. Login to get Token
        console.log('[PROBE] logging in as admin@urbanease.com...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@urbanease.com',
            password: 'password123'
        });

        const token = loginRes.data.token;
        const userId = loginRes.data._id || loginRes.data.id;
        console.log('[PROBE] Login Successful. User ID:', userId);

        // 2. Validate User Existence (to prevent null user crash)
        console.log('[PROBE] Verifying User Profile...');
        const profileRes = await axios.get(`${BASE_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('[PROBE] User Name:', profileRes.data.name);

        // 3. Construct Payload EXACTLY like mobile
        const payload = {
            contactNumber: "+923001234567",
            vehicleType: "Car",
            vehicleName: "Honda City Probe",
            vehicleNumber: "ABC-999",
            seatingCapacity: 4,
            seatsAvailable: 3,
            tripType: "two-way",
            schedule: [
                {
                    day: "Mon",
                    goingTime: "8:00",
                    goingPeriod: "AM",
                    returnTime: "5:00",
                    returnPeriod: "PM"
                }
            ],
            pickupLocation: "Urban E Society",
            destination: "Probe Destination"
        };

        console.log('[PROBE] Sending Carpool Creation Request:', JSON.stringify(payload, null, 2));

        const createRes = await axios.post(`${BASE_URL}/carpool`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('[PROBE] SUCCESS! Carpool Created:', createRes.data);

        // 4. Cleanup (Delete the probe entry)
        const newId = createRes.data._id;
        if (newId) {
            console.log(`[PROBE] Cleaning up (Deleting ${newId})...`);
            await axios.delete(`${BASE_URL}/carpool/${newId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('[PROBE] Cleanup Successful.');
        }

    } catch (error) {
        console.error('################ PROBE FAILED ################');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
    }
};

runProbe();
