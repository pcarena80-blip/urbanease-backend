const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const checkAdmin = async () => {
    try {
        const admin = await User.findOne({ email: 'admin@urbanease.com' });
        if (admin) {
            console.log('Admin found:', admin.email);
            console.log('Role:', admin.role);
            console.log('Password Hash:', admin.password ? 'Exists' : 'Missing');
        } else {
            console.log('Admin NOT found');
        }
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAdmin();
