/**
 * FIX: Carpool Multi-Entry + Database Cleanup
 * Run: node backend/scripts/fix_carpool_and_cleanup.js
 * 
 * This script:
 * 1. Drops any unique index on 'provider' that blocks multiple carpools
 * 2. Deletes ALL existing carpool records
 * 3. Verifies the fix
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function fixCarpoolsAndCleanup() {
    try {
        console.log('🔧 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!\n');

        const db = mongoose.connection.db;
        const collection = db.collection('carpools');

        // Step 1: List all indexes
        console.log('📋 Current indexes on carpools collection:');
        const indexes = await collection.indexes();
        indexes.forEach((idx, i) => {
            console.log(`  ${i + 1}. ${JSON.stringify(idx.key)} - unique: ${idx.unique || false} - name: ${idx.name}`);
        });
        console.log();

        // Step 2: Drop any unique index on 'provider'
        console.log('🔨 Checking for blocking unique indexes...');
        for (const idx of indexes) {
            if (idx.key.provider && idx.unique === true) {
                console.log(`  🗑️ Dropping unique index '${idx.name}' on provider...`);
                try {
                    await collection.dropIndex(idx.name);
                    console.log(`  ✅ Dropped '${idx.name}'`);
                } catch (e) {
                    console.log(`  ⚠️ Could not drop '${idx.name}': ${e.message}`);
                }
            }
        }
        console.log();

        // Step 3: Delete ALL carpool records
        console.log('🗑️ Deleting ALL existing carpool records...');
        const deleteResult = await collection.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.deletedCount} carpool record(s)\n`);

        // Step 4: Verify
        console.log('📋 Updated indexes on carpools collection:');
        const updatedIndexes = await collection.indexes();
        updatedIndexes.forEach((idx, i) => {
            console.log(`  ${i + 1}. ${JSON.stringify(idx.key)} - unique: ${idx.unique || false}`);
        });

        const count = await collection.countDocuments();
        console.log(`\n📊 Current carpool count: ${count}`);

        console.log('\n🎉 Carpool fix complete! Users can now create multiple carpools.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB.');
    }
}

fixCarpoolsAndCleanup();
