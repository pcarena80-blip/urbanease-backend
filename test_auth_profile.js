const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testFlow = async () => {
    try {
        console.log('1. Attempting Login...');
        // We need a valid user email/password. From the checkData output or previous context, we might know one.
        // Let's try the user from the checkData log if visible, or a known test user.
        // I will blindly try 'user@gmail.com' / 'User@1234' (common test creds) or search logs.
        // Wait, I saw 'user@example.com' in previous logs?
        // Let's first finding a user from the DB using a script? NO, I can't invoke DB here easily without models.
        // I'll rely on the existing 'checkData' output which I haven't fully seen the body of.
        // Let's blindly try to login as the first user found in checkData output if I could read it again. 
        // Better: I'll simple create a temporary user to test.

        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'test_user_debug@urbanease.com',
            password: 'Test@1234'
        });

        console.log('Login Success! Token:', loginRes.data.token ? 'YES' : 'NO');
        const token = loginRes.data.token;

        console.log('2. Fetching Profile...');
        const profileRes = await axios.get(`${BASE_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Profile Fetch Success!');
        console.log('Profile Data:', profileRes.data);

        console.log('3. Fetching Notices...');
        const noticesRes = await axios.get(`${BASE_URL}/notices`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Notices Found: ${noticesRes.data.length}`);
        console.log('Notice Titles:', noticesRes.data.map(n => n.title));

    } catch (error) {
        console.error('TEST FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

testFlow();
