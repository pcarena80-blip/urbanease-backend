const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://51.20.34.254:5000/api';

const createNotice = async () => {
    try {
        const token = fs.readFileSync('token.txt', 'utf8');
        const headers = { Authorization: `Bearer ${token}` };

        // Delete old notices first
        console.log('Fetching existing notices...');
        const existing = await axios.get(`${API_URL}/notices`, { headers });
        console.log(`Found ${existing.data.length} existing notices`);

        // Create new notice with proper dates
        console.log('\nCreating new valid notice...');
        const newNotice = {
            title: "Welcome to UrbanEase Community",
            description: "Thank you for being part of our community. All services are now fully operational. For any queries, please use the chat feature.",
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        };

        const res = await axios.post(`${API_URL}/admin/notices`, newNotice, { headers });
        console.log('Notice Created Successfully!');
        console.log('Response:', JSON.stringify(res.data, null, 2));

        // Verify by fetching again
        console.log('\nVerifying...');
        const verify = await axios.get(`${API_URL}/notices`, { headers });
        console.log(`Total notices now: ${verify.data.length}`);

        // Show latest notice
        const latest = verify.data[verify.data.length - 1];
        console.log(`Latest: "${latest.title}" | createdAt: ${latest.createdAt}`);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

createNotice();
