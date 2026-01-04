const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://51.20.34.254:5000/api';

const findFarhanBills = async () => {
    try {
        const token = fs.readFileSync('token.txt', 'utf8');
        const headers = { Authorization: `Bearer ${token}` };

        // Get all bills
        const res = await axios.get(`${API_URL}/admin/bills`, { headers });
        console.log(`Total ${res.data.length} bills in system:\n`);

        res.data.forEach((b, i) => {
            const userName = b.userId?.name || 'Unknown';
            const isFarhan = userName.toLowerCase().includes('farhan') ? ' <-- FARHAN!' : '';
            console.log(`[${i + 1}] ${userName} | ${b.billingMonth} | ${b.type} | ${b.status} | ID: ${b._id}${isFarhan}`);
        });

        // Filter Farhan's bills
        const farhanBills = res.data.filter(b =>
            b.userId?.name?.toLowerCase().includes('farhan')
        );

        console.log(`\n=== FARHAN'S BILLS: ${farhanBills.length} ===`);
        farhanBills.forEach(b => {
            console.log(`  - ${b.billingMonth} | ${b.type} | ${b.status} | ID: ${b._id}`);
        });

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

findFarhanBills();
