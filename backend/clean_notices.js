const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notice = require('./models/Notice');

dotenv.config();

const cleanNotices = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/urbanease');
        console.log('MongoDB Connected');

        // Delete all notices
        const result = await Notice.deleteMany({});
        console.log(`Deleted ${result.deletedCount} notices.`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

cleanNotices();
