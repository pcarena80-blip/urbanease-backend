const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://51.20.34.254:5000/api';

const checkAllBills = async () => {
    try {
        const token = fs.readFileSync('token.txt', 'utf8');
        const headers = { Authorization: `Bearer ${token}` };

        const res = await axios.get(`${API_URL}/admin/bills`, { headers });
        console.log(`Total ${res.data.length} bills:\n`);

        res.data.forEach((b, i) => {
            const userName = b.userId?.name || 'Unknown';
            console.log(`[${i + 1}] ${userName} | ${b.billingMonth} | ${b.type} | ${b.status} | Ref: ${b.referenceId}`);
        });

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

checkAllBills();
