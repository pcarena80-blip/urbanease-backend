/**
 * DELETE DATA VIA AWS API (not MongoDB)
 * This ensures the AWS server's data is modified
 */

const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://51.20.34.254:5000/api';

const cleanViaAPI = async () => {
    console.log('🔧 CLEANING VIA AWS API...\n');

    try {
        const token = fs.readFileSync('token.txt', 'utf8');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Delete ALL notices via API
        console.log('📋 DELETING OLD NOTICES...');
        const notices = await axios.get(`${API_URL}/notices`, { headers });
        console.log(`   Found ${notices.data.length} notices`);

        for (const notice of notices.data) {
            try {
                await axios.delete(`${API_URL}/admin/notices/${notice._id}`, { headers });
                console.log(`   ❌ Deleted notice: "${notice.title}" (ID: ${notice._id})`);
            } catch (e) {
                console.log(`   ⚠️ Could not delete notice ${notice._id}: ${e.response?.data?.message || e.message}`);
            }
        }

        // 2. Create fresh notice via API
        console.log('\n📢 CREATING FRESH NOTICE...');
        const newNotice = await axios.post(`${API_URL}/admin/notices`, {
            title: 'Welcome to UrbanEase Community',
            description: 'All services are now operational. Use the app to pay bills, file complaints, and stay connected.',
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, { headers });
        console.log(`   ✅ Created: "${newNotice.data.title}"`);

        // 3. Verify notices
        console.log('\n📊 VERIFYING...');
        const afterNotices = await axios.get(`${API_URL}/notices`, { headers });
        console.log(`   Notices now: ${afterNotices.data.length}`);
        afterNotices.data.forEach(n => {
            console.log(`   • "${n.title}" | createdAt: ${n.createdAt || 'MISSING'}`);
        });

        // 4. Delete all bills via API
        console.log('\n💰 CLEANING BILLS...');
        const bills = await axios.get(`${API_URL}/admin/bills`, { headers });
        console.log(`   Found ${bills.data.length} bills`);

        // Track which bills to keep (one per user/month/type)
        const billsToKeep = new Map();
        for (const bill of bills.data) {
            const key = `${bill.userId?._id || bill.userId}-${bill.billingMonth}-${bill.type}`;
            if (!billsToKeep.has(key)) {
                billsToKeep.set(key, bill._id);
            } else {
                // This is a duplicate - delete it
                try {
                    await axios.delete(`${API_URL}/admin/bills/${bill._id}`, { headers });
                    console.log(`   ❌ Deleted duplicate bill: ${bill._id}`);
                } catch (e) {
                    console.log(`   ⚠️ Could not delete bill ${bill._id}: ${e.response?.data?.message || e.message}`);
                }
            }
        }

        // 5. Verify bills
        const afterBills = await axios.get(`${API_URL}/admin/bills`, { headers });
        console.log(`   Bills now: ${afterBills.data.length}`);

        console.log('\n✅ API CLEANUP COMPLETE!');

    } catch (error) {
        console.error('❌ ERROR:', error.response?.data || error.message);
    }
};

cleanViaAPI();
