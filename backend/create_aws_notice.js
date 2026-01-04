const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://51.20.34.254:5000/api';

const createNotice = async () => {
    try {
        const token = fs.readFileSync('token.txt', 'utf8');
        const headers = { Authorization: `Bearer ${token}` };

        const newNotice = {
            title: "Welcome to UrbanEase",
            description: "We have updated the system. Chat and Bills are now working correctly.",
            expiryDate: new Date(Date.now() + 86400000 * 7) // 7 days
        };

        const res = await axios.post(`${API_URL}/admin/notices`, newNotice, { headers });
        console.log('Notice Created:', res.status, res.data.title);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

createNotice();
