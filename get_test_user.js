const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const getUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({});
        if (user) {
            console.log('REAL USER FOUND:', user.email);
            // We can't know the password (hashed), but we can RESET it to a known one for testing if we are desperate.
            // Or better, we just Create a new test user.

            // Create test user if not exists
            const testEmail = 'test_user_debug@urbanease.com';
            let testUser = await User.findOne({ email: testEmail });
            if (!testUser) {
                const salt = await require('bcryptjs').genSalt(10);
                const hashedPassword = await require('bcryptjs').hash('Test@1234', salt);
                testUser = await User.create({
                    name: 'Test Debug User',
                    email: testEmail,
                    password: hashedPassword,
                    phone: '0000000000',
                    role: 'user',
                    isVerified: true
                });
                console.log('CREATED TEST USER:', testEmail);
            } else {
                console.log('USING EXISTING TEST USER:', testEmail);
            }
        }
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

getUser();
