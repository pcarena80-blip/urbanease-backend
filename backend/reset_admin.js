const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

// Define Admin Credentials
const ADMIN_EMAIL = 'admin@urbanease.com';
const ADMIN_PASS = 'pakistan123';

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Check if Admin Exists
        const admin = await User.findOne({ email: ADMIN_EMAIL });

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASS, salt);

        if (admin) {
            console.log('Found existing Admin. Updating password...');
            admin.password = hashedPassword;
            admin.role = 'superadmin'; // Ensure role is correct
            admin.isVerified = true;
            await admin.save();
            console.log('✅ Admin Password Updated Successfully!');
        } else {
            console.log('Admin not found. Creating new Super Admin...');
            await User.create({
                name: 'Super Admin',
                email: ADMIN_EMAIL,
                phone: '03001234567',
                password: hashedPassword,
                role: 'superadmin',
                isVerified: true,
                propertyType: 'house' // Default
            });
            console.log('✅ Admin Account Created Successfully!');
        }

        console.log(`\n👉 Login with:\nEmail: ${ADMIN_EMAIL}\nPassword: ${ADMIN_PASS}\n`);
        process.exit();

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

resetAdmin();
