const axios = require('axios');

const check = async () => {
    try {
        // Login
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@urbanease.com',
            password: 'pakistan123'
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token obtained.');

        // Get Notices
        const noticesRes = await axios.get('http://localhost:5000/api/notices', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Notices Data:', JSON.stringify(noticesRes.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

check();
