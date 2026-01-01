const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs'); // Import bcrypt
const User = require('./models/User');
const Bill = require('./models/Bill');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const seedData = async () => {
    try {
        // 1. Remove Test User if exists (Cleaning up old test data)
        await User.deleteOne({ email: 'test@example.com' });
        console.log('Removed Test User (if existed)');

        // 2. Ensure Super Admin Exists
        const adminEmail = 'admin@urbanease.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);

            const adminUser = await User.create({
                name: 'Super Admin',
                email: adminEmail,
                phone: '0000000000',
                password: hashedPassword,
                role: 'superadmin',
                isVerified: true
            });
            console.log('Super Admin created:', adminUser.email);
        } else {
            console.log('Super Admin already exists');
        }

        console.log('Database seeded/cleaned! Please refresh MongoDB Compass.');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
