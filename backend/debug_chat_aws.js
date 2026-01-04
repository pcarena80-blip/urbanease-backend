const axios = require('axios');
const API_URL = 'http://51.20.34.254:5000/api';

const debugChat = async () => {
    try {
        console.log('--- Debugging AWS Chat ---');
        // Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@urbanease.com',
            password: 'pakistan123'
        });
        const token = loginRes.data.token;
        const fs = require('fs');
        fs.writeFileSync('token.txt', token);
        console.log('Login Token Saved to token.txt');
        const headers = { Authorization: `Bearer ${token}` };

        // Send Text Message
        console.log('Attempting to send text message...');
        try {
            const res = await axios.post(`${API_URL}/chat`, {
                receiverId: 'community',
                message: 'Debug Message from Script'
            }, { headers });
            console.log('Text Message Response:', res.status, res.data);
        } catch (e) {
            console.error('Text Message Failed:', e.response ? e.response.data : e.message);
        }

    } catch (error) {
        console.error('Fatal Error:', error.message);
    }
};

debugChat();
