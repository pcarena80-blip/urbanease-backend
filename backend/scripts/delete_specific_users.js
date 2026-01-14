/**
 * Script to delete specific users as requested
 * Run with: node backend/scripts/delete_specific_users.js
 * 
 * Users to delete:
 * - Umar Masood
 * - Masroor Ahmed
 * - Saim Ali
 * - Probe (ID: 1767)
 * - Sain Aman
 * - Khan
 * 
 * Also deletes all associated data: complaints, chat messages, carpools
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const ChatMessage = require('../models/ChatMessage');
const Carpool = require('../models/CarpoolModel');

const USERS_TO_DELETE = [
    'Umar Masood',
    'Masroor Ahmed',
    'Saim Ali',
    'Sain Aman',
    'Khan'
];

// For Probe with ID 1767, we'll search by partial name match
const PARTIAL_NAME_MATCHES = ['Probe', '1767'];

async function deleteSpecificUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find users by exact name match
        let usersToDelete = await User.find({
            name: { $in: USERS_TO_DELETE }
        });

        // Also find partial matches for "Probe" or "1767"
        for (const partial of PARTIAL_NAME_MATCHES) {
            const partialMatches = await User.find({
                name: { $regex: partial, $options: 'i' }
            });
            usersToDelete = [...usersToDelete, ...partialMatches];
        }

        // Remove duplicates
        const uniqueUsers = [...new Map(usersToDelete.map(u => [u._id.toString(), u])).values()];

        console.log(`\n📋 Found ${uniqueUsers.length} users to delete:`);
        uniqueUsers.forEach(u => console.log(`   - ${u.name} (${u.email})`));

        if (uniqueUsers.length === 0) {
            console.log('No matching users found. Exiting.');
            process.exit(0);
        }

        const userIds = uniqueUsers.map(u => u._id);

        // Delete associated data
        console.log('\n🗑️ Deleting associated data...');

        // Delete complaints
        const complaintsResult = await Complaint.deleteMany({ userId: { $in: userIds } });
        console.log(`   - Deleted ${complaintsResult.deletedCount} complaints`);

        // Delete chat messages (both sent and received)
        const chatResult = await ChatMessage.deleteMany({
            $or: [
                { senderId: { $in: userIds } },
                { receiverId: { $in: userIds.map(id => id.toString()) } }
            ]
        });
        console.log(`   - Deleted ${chatResult.deletedCount} chat messages`);

        // Delete carpools
        const carpoolResult = await Carpool.deleteMany({ provider: { $in: userIds } });
        console.log(`   - Deleted ${carpoolResult.deletedCount} carpool listings`);

        // Delete users
        console.log('\n🗑️ Deleting users...');
        const usersResult = await User.deleteMany({ _id: { $in: userIds } });
        console.log(`   - Deleted ${usersResult.deletedCount} users`);

        console.log('\n✅ All specified users and their data have been deleted successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the script
deleteSpecificUsers();
