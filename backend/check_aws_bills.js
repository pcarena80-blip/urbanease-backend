const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://51.20.34.254:5000/api';

const checkBills = async () => {
    try {
        const token = fs.readFileSync('token.txt', 'utf8');
        const headers = { Authorization: `Bearer ${token}` };

        const res = await axios.get(`${API_URL}/admin/bills`, { headers });
        console.log(`Found ${res.data.length} bills.`);

        const bills = res.data.map(b =>
            `[BILL] ID: ${b._id} | User: ${b.userId?._id} | Month: "${b.billingMonth}" | Type: "${b.type}" | Status: ${b.status} | Amount: ${b.amount}\n`
        ).join('');

        fs.writeFileSync('bills_dump.txt', bills);
        console.log('Dumped bills to bills_dump.txt');

    } catch (error) {
        console.error('Error:', error.message);
    }
};

checkBills();
