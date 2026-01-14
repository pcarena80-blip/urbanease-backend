const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createdb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'debug_db_user@test.com';
        const password = 'Password@123';

        // Delete if exists
        await User.deleteOne({ email });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name: 'Debug DB User',
            email,
            password: hashedPassword,
            phone: `+92${Math.floor(Math.random() * 1000000000)}`,
            role: 'user', // Correct enum
            isVerified: true,
            cnic: `${Math.floor(Math.random() * 100000)}-${Math.floor(Math.random() * 10000000)}-${Math.floor(Math.random() * 9)}`
        });

        console.log('✅ Created User:', user.email);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
createdb();
