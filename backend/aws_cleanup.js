/**
 * RUN THIS DIRECTLY ON AWS EC2 SERVER
 * 
 * Copy this file to the AWS server and run: node aws_cleanup.js
 * OR run the commands after opening mongo shell
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Notice = require('./models/Notice');
const Bill = require('./models/Bill');
const User = require('./models/User');

const runCleanup = async () => {
    console.log('🔧 AWS DIRECT CLEANUP\n');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // DELETE ALL NOTICES using deleteMany (works with any _id format)
        console.log('\n📋 Deleting ALL notices...');
        const noticeResult = await Notice.collection.deleteMany({});
        console.log(`   Deleted ${noticeResult.deletedCount} notices`);

        // CREATE fresh notice
        console.log('\n📢 Creating fresh notice...');
        const newNotice = await Notice.create({
            title: 'Welcome to UrbanEase Community',
            description: 'All services are operational. Use the app to pay bills, file complaints, and chat with your community.',
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        console.log(`   Created: ${newNotice.title} (ID: ${newNotice._id})`);
        console.log(`   createdAt: ${newNotice.createdAt}`);

        // CLEANUP DUPLICATE BILLS
        console.log('\n💰 Cleaning duplicate bills...');
        const allBills = await Bill.find({});
        const billMap = new Map();
        let deleted = 0;

        for (const bill of allBills) {
            const key = `${bill.userId}-${bill.billingMonth}-${bill.type}`;
            if (billMap.has(key)) {
                await Bill.deleteOne({ _id: bill._id });
                deleted++;
                console.log(`   Deleted duplicate: ${bill._id}`);
            } else {
                billMap.set(key, true);
            }
        }
        console.log(`   Deleted ${deleted} duplicate bills`);

        // VERIFY
        console.log('\n📊 FINAL STATE:');
        console.log(`   Notices: ${await Notice.countDocuments({})}`);
        console.log(`   Bills: ${await Bill.countDocuments({})}`);
        console.log(`   Users: ${await User.countDocuments({ role: 'user' })}`);

        console.log('\n✅ CLEANUP COMPLETE!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runCleanup();
