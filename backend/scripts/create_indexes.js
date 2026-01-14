/**
 * Database Indexes Script for UrbanEase
 * Run: node backend/scripts/create_indexes.js
 * 
 * Creates performance indexes for common query patterns
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function createIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!\n');

        const db = mongoose.connection.db;

        // ===== Complaints Collection =====
        console.log('Creating indexes on complaints collection...');

        try {
            await db.collection('complaints').createIndex(
                { status: 1, createdAt: -1 },
                { name: 'status_createdAt_idx' }
            );
            console.log('  ✓ Created: status + createdAt index');
        } catch (e) {
            if (e.code === 85) console.log('  - Index already exists: status_createdAt');
            else throw e;
        }

        try {
            await db.collection('complaints').createIndex(
                { userId: 1 },
                { name: 'userId_idx' }
            );
            console.log('  ✓ Created: userId index');
        } catch (e) {
            if (e.code === 85) console.log('  - Index already exists: userId');
            else throw e;
        }

        try {
            await db.collection('complaints').createIndex(
                { category: 1, status: 1 },
                { name: 'category_status_idx' }
            );
            console.log('  ✓ Created: category + status index');
        } catch (e) {
            if (e.code === 85) console.log('  - Index already exists: category_status');
            else throw e;
        }

        // ===== Notices Collection =====
        console.log('\nCreating indexes on notices collection...');

        try {
            await db.collection('notices').createIndex(
                { expiryDate: 1 },
                { name: 'expiryDate_idx' }
            );
            console.log('  ✓ Created: expiryDate index');
        } catch (e) {
            if (e.code === 85) console.log('  - Index already exists: expiryDate');
            else throw e;
        }

        // ===== Chat Messages Collection =====
        console.log('\nCreating indexes on chatmessages collection...');

        try {
            await db.collection('chatmessages').createIndex(
                { receiverId: 1, timestamp: -1 },
                { name: 'receiverId_timestamp_idx' }
            );
            console.log('  ✓ Created: receiverId + timestamp index');
        } catch (e) {
            if (e.code === 85) console.log('  - Index already exists: receiverId_timestamp');
            else throw e;
        }

        try {
            await db.collection('chatmessages').createIndex(
                { senderId: 1 },
                { name: 'senderId_idx' }
            );
            console.log('  ✓ Created: senderId index');
        } catch (e) {
            if (e.code === 85) console.log('  - Index already exists: senderId');
            else throw e;
        }

        // ===== Login History Collection =====
        console.log('\nCreating indexes on loginhistories collection...');

        try {
            await db.collection('loginhistories').createIndex(
                { loginTime: -1 },
                { name: 'loginTime_idx' }
            );
            console.log('  ✓ Created: loginTime index');
        } catch (e) {
            if (e.code === 85) console.log('  - Index already exists: loginTime');
            else throw e;
        }

        // ===== Users Collection =====
        console.log('\nCreating indexes on users collection...');

        try {
            await db.collection('users').createIndex(
                { role: 1, isVerified: 1 },
                { name: 'role_isVerified_idx' }
            );
            console.log('  ✓ Created: role + isVerified index');
        } catch (e) {
            if (e.code === 85) console.log('  - Index already exists: role_isVerified');
            else throw e;
        }

        // ===== Carpools Collection =====
        console.log('\nCreating indexes on carpools collection...');

        try {
            await db.collection('carpools').createIndex(
                { provider: 1 },
                { name: 'provider_idx' }
            );
            console.log('  ✓ Created: provider index');
        } catch (e) {
            if (e.code === 85) console.log('  - Index already exists: provider');
            else throw e;
        }

        console.log('\n✅ All indexes created successfully!');
        console.log('\nIndex creation complete. Query performance should be improved.');

    } catch (error) {
        console.error('Error creating indexes:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB.');
    }
}

createIndexes();
