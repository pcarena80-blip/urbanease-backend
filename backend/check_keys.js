const axios = require('axios');

const check = async () => {
    try {
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@urbanease.com',
            password: 'pakistan123'
        });
        const token = loginRes.data.token;

        const noticesRes = await axios.get('http://localhost:5000/api/notices', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (noticesRes.data.length > 0) {
            console.log('KEYS:', Object.keys(noticesRes.data[0]));
            console.log('CreatedAt Value:', noticesRes.data[0].createdAt);
            console.log('CreatedAt Type:', typeof noticesRes.data[0].createdAt);
        } else {
            console.log('No notices found.');
        }

    } catch (error) {
        console.error(error.message);
    }
};

check();
