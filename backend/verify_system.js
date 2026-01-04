/**
 * SYSTEM VERIFICATION SCRIPT
 * Verifies the system is in correct state after cleanup
 */

const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://51.20.34.254:5000/api';

const verify = async () => {
    console.log('🔍 SYSTEM VERIFICATION\n');

    try {
        const token = fs.readFileSync('token.txt', 'utf8');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Check Notices
        console.log('📋 NOTICES:');
        const notices = await axios.get(`${API_URL}/notices`, { headers });
        console.log(`   Total: ${notices.data.length}`);
        notices.data.forEach(n => {
            const hasValidDate = n.createdAt && !isNaN(new Date(n.createdAt).getTime());
            console.log(`   • "${n.title}" | createdAt: ${hasValidDate ? '✅ Valid' : '❌ Invalid'}`);
        });
        console.log('');

        // 2. Check Bills
        console.log('💰 BILLS (via Admin):');
        const bills = await axios.get(`${API_URL}/admin/bills`, { headers });
        console.log(`   Total: ${bills.data.length}`);

        // Check for duplicates
        const billKeys = new Set();
        let duplicates = 0;
        bills.data.forEach(b => {
            const key = `${b.userId?._id}-${b.billingMonth}-${b.type}`;
            if (billKeys.has(key)) {
                duplicates++;
                console.log(`   ⚠️ Duplicate: ${key}`);
            }
            billKeys.add(key);
        });
        console.log(`   Duplicates: ${duplicates === 0 ? '✅ None' : `❌ ${duplicates} found`}`);
        console.log('');

        // 3. Check Chat Messages
        console.log('💬 CHAT (Community):');
        const chat = await axios.get(`${API_URL}/chat/community`, { headers });
        console.log(`   Total messages: ${chat.data.length}`);

        let brokenAttachments = 0;
        chat.data.forEach(m => {
            if (m.attachment && (m.attachment.startsWith('/opt/') || m.attachment.startsWith('/var/'))) {
                brokenAttachments++;
            }
        });
        console.log(`   Broken attachments: ${brokenAttachments === 0 ? '✅ None' : `❌ ${brokenAttachments} found`}`);
        console.log('');

        // 4. API Health
        console.log('🏥 API HEALTH:');
        const health = await axios.get(`${API_URL.replace('/api', '')}`);
        console.log(`   Status: ${health.status === 200 ? '✅ Online' : '❌ Issues'}`);
        console.log(`   Response: ${health.data}`);
        console.log('');

        // Summary
        console.log('='.repeat(40));
        if (duplicates === 0 && brokenAttachments === 0 && notices.data.length > 0) {
            console.log('✅ SYSTEM VERIFICATION PASSED!');
            console.log('   All checks completed successfully.');
        } else {
            console.log('⚠️ SYSTEM HAS ISSUES:');
            if (duplicates > 0) console.log('   - Duplicate bills exist');
            if (brokenAttachments > 0) console.log('   - Broken chat attachments exist');
            if (notices.data.length === 0) console.log('   - No notices exist');
        }

    } catch (error) {
        console.error('❌ VERIFICATION FAILED:', error.response?.data || error.message);
    }
};

verify();
