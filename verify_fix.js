const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const verify = async () => {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const User = require('./models/User');

        console.log('Running Query...');
        const users = await User.find({
            $or: [
                { role: 'user' },
                { role: { $exists: false } },
                { role: null }
            ]
        });

        console.log(`Query returned ${users.length} users.`);
        users.forEach(u => console.log(` - ${u.name} (Role: ${u.role})`));

        console.log('---');
        console.log('Checking for Super Admin (should be excluded):');
        const admin = await User.findOne({ email: 'admin@urbanease.com' });
        if (admin) console.log(`Super Admin found: ${admin.name} (Role: ${admin.role})`);

        // Check if query excludes him
        const isIncluded = users.find(u => u.email === 'admin@urbanease.com');
        console.log(`Is Super Admin in result set? ${isIncluded ? 'YES (FAIL)' : 'NO (PASS)'}`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

verify();
