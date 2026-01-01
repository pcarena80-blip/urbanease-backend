const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const checkDuplicates = async () => {
    await connectDB();

    const users = await User.find({});
    const emailMap = new Map();
    const duplicates = [];

    users.forEach(user => {
        const lowerEmail = user.email.toLowerCase();
        if (emailMap.has(lowerEmail)) {
            duplicates.push({
                email: lowerEmail,
                ids: [emailMap.get(lowerEmail)._id, user._id],
                original: emailMap.get(lowerEmail).email, // Show original casing
                duplicate: user.email
            });
        } else {
            emailMap.set(lowerEmail, user);
        }
    });

    if (duplicates.length > 0) {
        console.log('FOUND DUPLICATES:', JSON.stringify(duplicates, null, 2));
    } else {
        console.log('NO DUPLICATES FOUND');
    }

    process.exit();
};

checkDuplicates();
