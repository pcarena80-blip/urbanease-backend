const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const deleteTestUser = async () => {
    try {
        // Connect to the PRODUCTION database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Delete the Test Debug User by ID (from production database)
        const userId = '694d98b7912faefba0d2a796';
        const result = await User.findByIdAndDelete(userId);

        if (result) {
            console.log('✓ Successfully deleted Test Debug User:', result.name);
        } else {
            console.log('User not found with ID:', userId);
        }

        await mongoose.connection.close();
        console.log('Connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

deleteTestUser();
