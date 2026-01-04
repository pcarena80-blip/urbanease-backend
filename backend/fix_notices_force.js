/**
 * FORCE DELETE ALL NOTICES AND CREATE FRESH ONE
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Notice = require('./models/Notice');
const MONGO_URI = process.env.MONGO_URI;

const fixNotices = async () => {
    console.log('🔧 FORCE FIXING NOTICES...\n');

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // DELETE ALL notices regardless of ID format
        const result = await Notice.deleteMany({});
        console.log(`❌ Deleted ${result.deletedCount} notices`);

        // Create fresh notice
        const newNotice = await Notice.create({
            title: 'Welcome to UrbanEase Community',
            description: 'All services are now operational. Use the app to pay bills, file complaints, and stay connected with your community.',
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
        console.log(`✅ Created fresh notice: "${newNotice.title}"`);
        console.log(`   ID: ${newNotice._id}`);
        console.log(`   createdAt: ${newNotice.createdAt}`);

        // Verify
        const allNotices = await Notice.find({});
        console.log(`\n📊 Total notices now: ${allNotices.length}`);
        allNotices.forEach(n => {
            console.log(`   • "${n.title}" | createdAt: ${n.createdAt}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected');
    }
};

fixNotices();
