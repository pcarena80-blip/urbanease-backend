const axios = require('axios');

const checkAws = async () => {
    try {
        console.log('--- Connecting to AWS API ---');
        // Login to AWS
        const loginRes = await axios.post('http://51.20.34.254:5000/api/auth/login', {
            email: 'admin@urbanease.com',
            password: 'pakistan123'
        });
        const token = loginRes.data.token;
        console.log('AWS Login Successful. Token received.');

        // Get Notices from AWS
        const noticesRes = await axios.get('http://51.20.34.254:5000/api/notices', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`[CHECK] Found ${noticesRes.data.length} notices on AWS.`);
        noticesRes.data.forEach(n => {
            console.log(`[NOTICE] Title: "${n.title}" | ID: ${n._id} | Date: ${n.createdAt}`);
        });

    } catch (error) {
        if (error.response) {
            console.error('AWS Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

checkAws();
