const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://51.20.34.254:5000/api';

const fixDuplicates = async () => {
    try {
        const token = fs.readFileSync('token.txt', 'utf8');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Get All Bills
        const res = await axios.get(`${API_URL}/admin/bills`, { headers });
        const bills = res.data;
        console.log(`Scanning ${bills.length} bills for duplicates...`);

        const billsMap = {};

        // Group by Composite Key
        bills.forEach(b => {
            const key = `${b.userId?._id}-${b.billingMonth}-${b.type}`;
            if (!billsMap[key]) billsMap[key] = [];
            billsMap[key].push(b);
        });

        // 2. Identify and Delete Duplicates
        let deletedCount = 0;
        for (const key of Object.keys(billsMap)) {
            const group = billsMap[key];
            if (group.length > 1) {
                console.log(`Duplicate found for ${key} (${group.length} bills)`);

                // Sort: Prioritize PAID, then NEWEST created
                group.sort((a, b) => {
                    if (a.status === 'paid' && b.status !== 'paid') return -1; // keep paid
                    if (b.status === 'paid' && a.status !== 'paid') return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt); // newest first (often most relevant if both unpaid)
                    // If no createdAt (old data), fallback to ID? ID is monotonic roughly.
                    // Assuming newer ID > older ID.
                });

                const toKeep = group[0];
                const toDelete = group.slice(1);

                console.log(`  Keeping: ${toKeep._id} (${toKeep.status})`);

                for (const bill of toDelete) {
                    try {
                        console.log(`  Deleting: ${bill._id} (${bill.status})`);
                        await axios.delete(`${API_URL}/admin/bills/${bill._id}`, { headers });
                        console.log('    -> Deleted successfully');
                        deletedCount++;
                    } catch (e) {
                        console.error(`    -> Failed to delete: ${e.response ? e.response.status : e.message}`);
                    }
                }
            }
        }
        console.log(`\nCleanup Complete. Removed ${deletedCount} duplicate bills.`);

    } catch (error) {
        console.error('Error:', error.message);
    }
};

fixDuplicates();
