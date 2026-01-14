const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config();

// Define minimal Schema to delete
const carpoolSchema = new mongoose.Schema({}, { strict: false });
const Carpool = mongoose.model('Carpool', carpoolSchema);

const clearData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected.');

        const result = await Carpool.deleteMany({});
        console.log(`Deleted ${result.deletedCount} carpool listings.`);

        console.log('Done.');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

clearData();
