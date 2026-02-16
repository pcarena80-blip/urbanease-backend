const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('./models/User');
const connectDB = require('./config/db');

connectDB().then(async () => {
    const user = await User.findOne({ email: 'admin@urbanease.com' });
    if (user) {
        user.role = 'superadmin';
        user.phone = '03010816321';
        user.name = 'Super Admin';
        await user.save();
        console.log('Updated:', user.email, '| role:', user.role, '| phone:', user.phone, '| name:', user.name);
    } else {
        console.log('User not found');
    }
    process.exit();
});
