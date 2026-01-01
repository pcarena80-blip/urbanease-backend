const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const removeUser = async () => {
    try {
        const userName = 'Test Debug User';
        const user = await User.findOne({ name: userName });

        if (user) {
            await User.deleteOne({ _id: user._id });
            console.log(`Successfully removed user: ${userName}`);
        } else {
            console.log(`User '${userName}' not found.`);
        }
        process.exit();
    } catch (error) {
        console.error('Error removing user:', error);
        process.exit(1);
    }
};

removeUser();
