// Script to clean up corrupted chat messages with invalid senderId
require('dotenv').config();
const mongoose = require('mongoose');

async function cleanup() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected!');

        // Find and delete messages with invalid senderId (non-ObjectId values)
        const result = await mongoose.connection.db.collection('chatmessages').deleteMany({
            $or: [
                { senderId: 'unread' },
                { senderId: { $type: 'string', $not: { $regex: /^[a-f\d]{24}$/i } } }
            ]
        });

        console.log(`Deleted ${result.deletedCount} corrupted messages`);

        // Also clean up any orphaned messages
        const ChatMessage = require('./models/ChatMessage');
        const User = require('./models/User');

        const userIds = await User.find().distinct('_id');
        const userIdStrings = userIds.map(id => id.toString());

        // Find messages where senderId doesn't exist in users
        const orphaned = await ChatMessage.deleteMany({
            senderId: { $nin: userIds }
        });

        console.log(`Deleted ${orphaned.deletedCount} orphaned messages`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done!');
    }
}

cleanup();
