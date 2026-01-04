/**
 * MASTER CLEANUP SCRIPT - UrbanEase System Repair
 * 
 * This script cleans ALL corrupted data from the production database:
 * 1. Deletes notices without valid createdAt timestamps
 * 2. Removes orphaned/duplicate bills
 * 3. Adds unique compound index on bills to prevent future duplicates
 * 4. Cleans chat messages with invalid attachment paths
 * 
 * Run with: node cleanup_all.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Models
const Notice = require('./models/Notice');
const Bill = require('./models/Bill');
const User = require('./models/User');
const ChatMessage = require('./models/ChatMessage');

const MONGO_URI = process.env.MONGO_URI;

const runCleanup = async () => {
    console.log('🔧 URBANEASE SYSTEM CLEANUP STARTING...\n');

    try {
        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // ============================================
        // 1. CLEANUP NOTICES
        // ============================================
        console.log('📋 PHASE 1: CLEANING NOTICES...');

        const allNotices = await Notice.find({});
        console.log(`   Found ${allNotices.length} total notices`);

        let deletedNotices = 0;
        for (const notice of allNotices) {
            // Check if createdAt is missing or invalid
            if (!notice.createdAt || isNaN(new Date(notice.createdAt).getTime())) {
                await Notice.findByIdAndDelete(notice._id);
                deletedNotices++;
                console.log(`   ❌ Deleted notice: "${notice.title}" (invalid createdAt)`);
            }
            // Check if expired
            else if (notice.expiryDate && new Date(notice.expiryDate) < new Date()) {
                await Notice.findByIdAndDelete(notice._id);
                deletedNotices++;
                console.log(`   ❌ Deleted notice: "${notice.title}" (expired)`);
            }
        }
        console.log(`   ✅ Deleted ${deletedNotices} invalid notices\n`);

        // ============================================
        // 2. CLEANUP BILLS
        // ============================================
        console.log('💰 PHASE 2: CLEANING BILLS...');

        // Get all valid user IDs
        const validUsers = await User.find({}, '_id');
        const validUserIds = new Set(validUsers.map(u => u._id.toString()));
        console.log(`   Found ${validUserIds.size} valid users`);

        const allBills = await Bill.find({});
        console.log(`   Found ${allBills.length} total bills`);

        let deletedBills = 0;
        let orphanedBills = 0;

        // Track bills by unique key to find duplicates
        const billMap = new Map(); // key: "userId-month-type" => bill[]

        for (const bill of allBills) {
            const userId = bill.userId?.toString();

            // Delete if user doesn't exist
            if (!userId || !validUserIds.has(userId)) {
                await Bill.findByIdAndDelete(bill._id);
                orphanedBills++;
                console.log(`   ❌ Deleted orphaned bill: ${bill._id}`);
                continue;
            }

            // Track for duplicate detection
            const key = `${userId}-${bill.billingMonth}-${bill.type}`;
            if (!billMap.has(key)) {
                billMap.set(key, []);
            }
            billMap.get(key).push(bill);
        }

        // Remove duplicates (keep the most recent or paid one)
        for (const [key, bills] of billMap) {
            if (bills.length > 1) {
                console.log(`   ⚠️  Found ${bills.length} duplicates for ${key}`);

                // Sort: paid first, then by createdAt descending
                bills.sort((a, b) => {
                    if (a.status === 'paid' && b.status !== 'paid') return -1;
                    if (b.status === 'paid' && a.status !== 'paid') return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });

                // Keep first, delete rest
                const toKeep = bills[0];
                for (let i = 1; i < bills.length; i++) {
                    await Bill.findByIdAndDelete(bills[i]._id);
                    deletedBills++;
                    console.log(`   ❌ Deleted duplicate: ${bills[i]._id} (keeping ${toKeep._id})`);
                }
            }
        }

        console.log(`   ✅ Deleted ${orphanedBills} orphaned + ${deletedBills} duplicate bills\n`);

        // ============================================
        // 3. ADD UNIQUE COMPOUND INDEX ON BILLS
        // ============================================
        console.log('🔒 PHASE 3: ADDING UNIQUE INDEX...');

        try {
            await Bill.collection.createIndex(
                { userId: 1, billingMonth: 1, type: 1 },
                { unique: true, background: true }
            );
            console.log('   ✅ Created unique compound index on bills (userId, billingMonth, type)\n');
        } catch (indexErr) {
            if (indexErr.code === 11000 || indexErr.code === 85) {
                console.log('   ⚠️  Index already exists or duplicates remain. Skipping.\n');
            } else {
                console.log('   ⚠️  Could not create index:', indexErr.message, '\n');
            }
        }

        // ============================================
        // 4. CLEANUP CHAT ATTACHMENTS
        // ============================================
        console.log('💬 PHASE 4: CLEANING CHAT ATTACHMENTS...');

        const messagesWithAttachments = await ChatMessage.find({ attachment: { $exists: true, $ne: null } });
        console.log(`   Found ${messagesWithAttachments.length} messages with attachments`);

        let fixedAttachments = 0;
        let deletedAttachments = 0;

        for (const msg of messagesWithAttachments) {
            const attachment = msg.attachment;

            // Check for Render paths that won't work on AWS
            if (attachment.startsWith('/opt/render/') || attachment.startsWith('/var/')) {
                // These paths are unrecoverable - nullify the attachment
                await ChatMessage.findByIdAndUpdate(msg._id, {
                    $set: { attachment: null, attachmentType: null }
                });
                deletedAttachments++;
                console.log(`   ❌ Cleared invalid path: ${attachment.substring(0, 50)}...`);
            }
            // Fix paths that should be relative
            else if (attachment.startsWith('/uploads/')) {
                const fixedPath = attachment.substring(1); // Remove leading /
                await ChatMessage.findByIdAndUpdate(msg._id, {
                    $set: { attachment: fixedPath }
                });
                fixedAttachments++;
            }
        }

        console.log(`   ✅ Fixed ${fixedAttachments}, Cleared ${deletedAttachments} invalid attachments\n`);

        // ============================================
        // 5. CREATE FRESH NOTICE
        // ============================================
        console.log('📢 PHASE 5: CREATING FRESH NOTICE...');

        const newNotice = await Notice.create({
            title: 'Welcome to UrbanEase Community',
            description: 'All services are now operational. Use the app to pay bills, file complaints, and stay connected with your community.',
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
        console.log(`   ✅ Created notice: "${newNotice.title}" (ID: ${newNotice._id})\n`);

        // ============================================
        // FINAL SUMMARY
        // ============================================
        console.log('='.repeat(50));
        console.log('🎉 CLEANUP COMPLETE!\n');

        const finalNotices = await Notice.countDocuments({});
        const finalBills = await Bill.countDocuments({});
        const finalUsers = await User.countDocuments({ role: 'user' });

        console.log('📊 FINAL STATE:');
        console.log(`   • Notices: ${finalNotices}`);
        console.log(`   • Bills: ${finalBills}`);
        console.log(`   • Users: ${finalUsers}`);
        console.log('');
        console.log('✅ System is now clean and ready for production!');

    } catch (error) {
        console.error('❌ CLEANUP FAILED:', error.message);
        console.error(error);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB');
    }
};

runCleanup();
