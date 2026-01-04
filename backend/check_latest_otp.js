require('dotenv').config();
const mongoose = require('mongoose');

const checkOtps = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check RegistrationOtp collection directly
        const registrationCollection = mongoose.connection.collection('registrationotps');
        const regOtps = await registrationCollection.find().sort({ $natural: -1 }).limit(5).toArray();

        console.log('\n--- Recent Registration OTPs ---');
        regOtps.forEach(doc => {
            console.log(`Email: ${doc.email}, OTP: ${doc.otp}, Verified: ${doc.isVerified}, Expires: ${new Date(doc.expiresAt).toLocaleString()}`);
        });

        // Check Users collection for Forgot Password OTPs
        const usersCollection = mongoose.connection.collection('users');
        const userOtps = await usersCollection.find({ otp: { $exists: true, $ne: null } }).limit(5).toArray();

        console.log('\n--- Recent Forgot Password OTPs ---');
        userOtps.forEach(doc => {
            console.log(`Email: ${doc.email}, OTP: ${doc.otp}, Expires: ${new Date(doc.otpExpires).toLocaleString()}`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkOtps();
