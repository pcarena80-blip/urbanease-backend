require('dotenv').config();
const mongoose = require('mongoose');

const checkOtps = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const registrationCollection = mongoose.connection.collection('registrationotps');
        const regOtps = await registrationCollection.find().sort({ $natural: -1 }).limit(1).toArray();
        if (regOtps.length > 0) {
            console.log(`LATEST_OTP:${regOtps[0].otp}`);
            console.log(`LATEST_EMAIL:${regOtps[0].email}`);
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkOtps();
