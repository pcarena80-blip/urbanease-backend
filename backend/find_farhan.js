const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://51.20.34.254:5000/api';

const findUser = async () => {
    try {
        const token = fs.readFileSync('token.txt', 'utf8');
        const headers = { Authorization: `Bearer ${token}` };

        // Get all residents
        const res = await axios.get(`${API_URL}/admin/residents`, { headers });
        console.log(`Total ${res.data.length} residents:\n`);

        res.data.forEach((u, i) => {
            const name = u.name || 'No Name';
            const isFarhan = name.toLowerCase().includes('farhan') ? ' <-- FOUND!' : '';
            console.log(`[${i + 1}] ${name} | ${u.email} | ID: ${u._id}${isFarhan}`);
        });

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

findUser();
