require('dotenv').config();
const mongoose = require('mongoose');
const Notice = require('./models/Notice');

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const missing = await Notice.find({ createdAt: { $exists: false } });
        console.log(`Found ${missing.length} notices without createdAt.`);

        if (missing.length > 0) {
            await Notice.updateMany(
                { createdAt: { $exists: false } },
                { $set: { createdAt: new Date(), updatedAt: new Date() } }
            );
            console.log('Fixed missing dates.');
        } else {
            // Also check for null
            const nullDates = await Notice.find({ createdAt: null });
            console.log(`Found ${nullDates.length} notices with null createdAt.`);
            if (nullDates.length > 0) {
                await Notice.updateMany(
                    { createdAt: null },
                    { $set: { createdAt: new Date(), updatedAt: new Date() } }
                );
                console.log('Fixed null dates.');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

fix();
