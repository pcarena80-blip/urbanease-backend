const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://51.20.34.254:5000/api';

const findUsers = async () => {
    try {
        const token = fs.readFileSync('token.txt', 'utf8');
        const headers = { Authorization: `Bearer ${token}` };

        // Get all users from admin endpoint
        const res = await axios.get(`${API_URL}/admin/users`, { headers });
        console.log(`Total ${res.data.length} users:\n`);

        res.data.forEach((u, i) => {
            const name = u.name || 'No Name';
            const verified = u.isVerified ? 'VERIFIED' : 'not verified';
            const isFarhan = name.toLowerCase().includes('farhan') ? ' <-- FARHAN!' : '';
            console.log(`[${i + 1}] ${name} | ${u.email} | ${verified} | ID: ${u._id}${isFarhan}`);
        });

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

findUsers();
