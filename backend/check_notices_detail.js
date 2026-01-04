const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://51.20.34.254:5000/api';

const checkNotices = async () => {
    try {
        const token = fs.readFileSync('token.txt', 'utf8');
        const headers = { Authorization: `Bearer ${token}` };

        const res = await axios.get(`${API_URL}/notices`, { headers });
        console.log(`Found ${res.data.length} notices:\n`);

        res.data.forEach((n, i) => {
            console.log(`[${i + 1}] Title: "${n.title}"`);
            console.log(`    ID: ${n._id}`);
            console.log(`    createdAt: ${n.createdAt}`);
            console.log(`    expiryDate: ${n.expiryDate}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

checkNotices();
