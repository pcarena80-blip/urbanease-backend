require('dotenv').config();
const mongoose = require('mongoose');
const Notice = require('./models/Notice');

const checkNotices = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const notices = await Notice.find({});
        console.log(`Found ${notices.length} notices.`);

        notices.forEach(n => {
            console.log(`ID: ${n._id}`);
            console.log(`Title: ${n.title}`);
            console.log(`CreatedAt: ${n.createdAt} (Type: ${typeof n.createdAt})`);
            console.log(`UpdatedAt: ${n.updatedAt}`);
            console.log('---');
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkNotices();
