const mongoose = require('mongoose');
const fs = require('fs');
const Notice = require('./models/Notice');

const fixRemote = async () => {
    try {
        // Read .env.bak manually as UTF-16 LE
        const envContent = fs.readFileSync('.env.bak', 'utf16le');
        const match = envContent.match(/MONGO_URI=(.+)/);

        if (!match) {
            console.error('Could not find MONGO_URI in .env.bak');
            process.exit(1);
        }

        const mongoUri = match[1].trim();
        console.log('Connecting to Remote DB...');

        await mongoose.connect(mongoUri);
        console.log('Remote MongoDB Connected!');

        const missing = await Notice.find({ createdAt: { $exists: false } });
        console.log(`Found ${missing.length} notices without createdAt on REMOTE DB.`);

        if (missing.length > 0) {
            await Notice.updateMany(
                { createdAt: { $exists: false } },
                { $set: { createdAt: new Date(), updatedAt: new Date() } }
            );
            console.log('Fixed remote missing dates.');
        } else {
            // Also check for null
            const nullDates = await Notice.find({ createdAt: null });
            console.log(`Found ${nullDates.length} notices with null createdAt on REMOTE DB.`);
            if (nullDates.length > 0) {
                await Notice.updateMany(
                    { createdAt: null },
                    { $set: { createdAt: new Date(), updatedAt: new Date() } }
                );
                console.log('Fixed remote null dates.');
            }
        }

        process.exit(0);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

fixRemote();
