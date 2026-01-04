const mongoose = require('mongoose');
require('dotenv').config();
const Bill = require('./models/Bill');

async function fixBills() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all bills
    const bills = await Bill.find({});
    console.log('Total bills:', bills.length);

    let fixed = 0;
    for (const bill of bills) {
        const updates = {};
        const timestamp = Date.now() + Math.floor(Math.random() * 1000);
        const randomNum = Math.floor(Math.random() * 10000);

        if (!bill.referenceId) {
            updates.referenceId = 'REF-' + timestamp + '-' + randomNum;
        }
        if (!bill.billId) {
            updates.billId = (bill.type || 'XX').substring(0, 2).toUpperCase() + '-' + timestamp + '-' + randomNum;
        }
        if (!bill.provider) {
            updates.provider = bill.type === 'electricity' ? 'IESCO' : bill.type === 'gas' ? 'SNGPL' : 'Urban Ease Residency';
        }
        if (!bill.billingMonth) {
            updates.billingMonth = 'January 2026';
        }

        if (Object.keys(updates).length > 0) {
            await Bill.updateOne({ _id: bill._id }, { $set: updates });
            console.log('Fixed bill:', bill._id.toString(), updates);
            fixed++;
        }
    }

    console.log('\nFixed', fixed, 'bills');
    process.exit(0);
}

fixBills().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
