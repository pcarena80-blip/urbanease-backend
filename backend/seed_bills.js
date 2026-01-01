const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bill = require('./models/Bill');
const User = require('./models/User'); // Need a user ID to link

dotenv.config();

const seedBills = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find the first user (likely the one created earlier)
        const user = await User.findOne();
        if (!user) {
            console.log('No users found. Create a user first.');
            process.exit(1);
        }

        // Clear existing bills
        await Bill.deleteMany({});
        console.log('Old bills cleared');

        const bills = [
            {
                userId: user._id,
                consumerId: '1001',
                type: 'Electricity',
                amount: 5400,
                dueDate: '10 Jan 2026',
                month: 'January 2026',
                refNo: 'REF-ELEC-1001',
                status: 'due',
                generatedDate: new Date()
            },
            {
                userId: user._id,
                consumerId: '1002',
                type: 'Water',
                amount: 1200,
                dueDate: '15 Jan 2026',
                month: 'January 2026',
                refNo: 'REF-WAT-1002',
                status: 'due',
                generatedDate: new Date()
            },
            {
                userId: user._id,
                consumerId: '1003',
                type: 'Maintenance',
                amount: 3000,
                dueDate: '05 Jan 2026',
                month: 'January 2026',
                refNo: 'REF-MAIN-1003',
                status: 'due',
                generatedDate: new Date()
            }
        ];

        await Bill.insertMany(bills);
        console.log('✅ Bills Seeded Successfully!');
        console.log('Use Consumer ID: 1001, 1002, or 1003 to test.');

        process.exit();
    } catch (error) {
        console.log('Error:', error);
        process.exit(1);
    }
};

seedBills();
