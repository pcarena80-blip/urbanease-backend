const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/urbanease');
        console.log('MongoDB Connected');

        const adminEmail = 'admin@urbanease.com';
        const user = await User.findOne({ email: adminEmail });

        if (user) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash('password123', salt);
            await user.save();
            console.log('Admin password reset to password123');
        } else {
            console.log('Admin user not found');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

resetPassword();
