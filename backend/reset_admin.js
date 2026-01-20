const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/urbanease');
        console.log('Connected to DB');

        const email = 'admin@urbanease.com';
        const password = 'pakistan123';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Try to update existing admin
        let admin = await User.findOne({ email });

        if (admin) {
            console.log('Admin user found. Updating password...');
            admin.password = hashedPassword;
            admin.role = 'admin'; // Ensure role is correct
            admin.isVerified = true;
            await admin.save();
            console.log('Admin password updated successfully.');
        } else {
            console.log('Admin user NOT found. Creating new admin...');
            admin = await User.create({
                name: 'Super Admin',
                email: email,
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
                phone: '0000000000',
                // Add dummy required fields if schema needs them
                block: 'A',
                street: '1',
                houseNo: '1'
            });
            console.log('New Admin user created.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error resetting admin:', error);
        process.exit(1);
    }
};

resetAdmin();
