const axios = require('axios');

const API_URL = 'http://51.20.34.254:5000/api';

const createTest = async () => {
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@urbanease.com',
            password: 'pakistan123'
        });
        const token = loginRes.data.token;
        console.log('Login Token:', token ? 'Received' : 'Missing');

        const config = { headers: { Authorization: `Bearer ${token}` } };

        const newNotice = {
            title: "Test Notice AWS",
            description: "Testing creation on AWS server",
            expiryDate: new Date(Date.now() + 86400000)
        };

        const res = await axios.post(`${API_URL}/admin/notices`, newNotice, config);
        console.log('Creation Response:', res.status, res.data);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

createTest();
