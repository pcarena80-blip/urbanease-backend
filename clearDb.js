const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const LoginHistory = require('./models/LoginHistory');
const UserProfile = require('./models/UserProfile');

dotenv.config();

const clearData = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/urbanease');
        console.log('MongoDB Connected');

        await User.deleteMany({});
        console.log('Users deleted');

        await LoginHistory.deleteMany({});
        console.log('Login History deleted');

        await UserProfile.deleteMany({});
        console.log('User Profiles deleted');

        console.log('Data cleared successfully');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

clearData();
