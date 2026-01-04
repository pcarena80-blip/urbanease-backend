const axios = require('axios');

const API_URL = 'http://51.20.34.254:5000/api';

const fixAwsNotices = async () => {
    try {
        console.log('--- Connecting to AWS API ---');
        // 1. Login to AWS
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@urbanease.com',
            password: 'pakistan123'
        });
        const token = loginRes.data.token;
        console.log('AWS Login Successful. Token received.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 2. Get All Notices
        const noticesRes = await axios.get(`${API_URL}/notices`, config);
        const notices = noticesRes.data;
        console.log(`Found ${notices.length} notices on AWS.`);

        if (notices.length === 0) {
            console.log('No notices found to fix.');
            return;
        }

        // 3. Recreate Each Notice
        for (const notice of notices) {
            console.log(`Processing Notice: "${notice.title}"...`);

            // Delete
            try {
                await axios.delete(`${API_URL}/admin/notices/${notice._id}`, config);
                console.log(`  - Deleted old notice.`);
            } catch (err) {
                console.error(`  - Failed to delete: ${err.message}`);
                // continue; // REMOVED: Create new notice anyway because we filter out the old broken ones in Frontend
            }

            // Create
            try {
                // Ensure expiryDate is valid or default to 1 year from now
                const expiry = notice.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

                await axios.post(`${API_URL}/admin/notices`, {
                    title: notice.title,
                    description: notice.description,
                    expiryDate: expiry
                }, config);
                console.log(`  - Re-created successfully.`);
            } catch (err) {
                console.error(`  - Failed to create: ${err.message}`);
            }
        }

        console.log('--- Fix Complete ---');

    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

fixAwsNotices();
