require('dotenv').config();
const mongoose = require('mongoose');
const RegistrationOtp = require('./models/RegistrationOtp');

const setOtp = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'gpt44311@gmail.com';
        const otp = '123456';
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

        await RegistrationOtp.findOneAndUpdate(
            { email },
            { email, otp, expiresAt, isVerified: false },
            { upsert: true, new: true }
        );

        console.log(`OTP for ${email} set to ${otp}`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

setOtp();
