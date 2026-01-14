const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const verifyLast = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne().sort({ createdAt: -1 });
        if (user) {
            user.isVerified = true;
            await user.save();
            console.log('✅ Verified User:', user.email);
        } else {
            console.log('❌ No user found');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
verifyLast();
