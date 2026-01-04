const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Bill = require('./models/Bill');

async function diagnose() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Get all users with role='user'
    const users = await User.find({ role: 'user' }).select('name email');
    console.log('Users with role=user:', users.length);
    users.forEach(u => console.log(' -', u.name, '|', u.email));

    // Get all bills
    console.log('\nCurrent bills in database:');
    const bills = await Bill.find({}).populate('userId', 'name');
    console.log('Total bills:', bills.length);
    bills.forEach(b => console.log(' -', b.userId?.name || 'Unknown', '|', b.type, '|', b.billingMonth));

    // Clear all bills for fresh start
    await Bill.deleteMany({});
    console.log('\n*** Cleared all bills for fresh dispatch ***');

    process.exit(0);
}

diagnose().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
