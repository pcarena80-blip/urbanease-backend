const axios = require('axios');

const BASE_URL = 'http://51.20.34.254:5000/api';

const checkServerHealth = async () => {
    console.log('[HEALTH CHECK] Testing AWS Server Performance...\n');

    try {
        // 1. Login timing
        console.log('[1] Testing Login Speed...');
        const loginStart = Date.now();
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@urbanease.com',
            password: 'password123'
        });
        const loginTime = Date.now() - loginStart;
        console.log(`[1] Login: ${loginTime}ms`);
        const token = loginRes.data.token;

        // 2. Inbox timing
        console.log('[2] Testing Inbox Speed...');
        const inboxStart = Date.now();
        const inboxRes = await axios.get(`${BASE_URL}/chat/inbox`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const inboxTime = Date.now() - inboxStart;
        console.log(`[2] Inbox (${inboxRes.data.length} chats): ${inboxTime}ms`);

        // 3. Messages timing (if inbox has chats)
        if (inboxRes.data.length > 0) {
            const chatId = inboxRes.data[0].id;
            console.log('[3] Testing Messages Speed...');
            const msgStart = Date.now();
            const msgRes = await axios.get(`${BASE_URL}/chat/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const msgTime = Date.now() - msgStart;
            console.log(`[3] Messages (${msgRes.data.length} msgs): ${msgTime}ms`);

            // Show sample message structure
            if (msgRes.data.length > 0) {
                console.log('\n[Sample Message Structure]:');
                console.log(JSON.stringify(msgRes.data[0], null, 2));
            }
        }

        // 4. Community chat timing
        console.log('[4] Testing Community Chat Speed...');
        const commStart = Date.now();
        const commRes = await axios.get(`${BASE_URL}/chat/community`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const commTime = Date.now() - commStart;
        console.log(`[4] Community (${commRes.data.length} msgs): ${commTime}ms`);

        console.log('\n✅ Health Check Complete!');
        console.log(`Total Response Times:
  - Login: ${loginTime}ms ${loginTime > 2000 ? '⚠️ SLOW' : '✓'}
  - Inbox: ${inboxTime}ms ${inboxTime > 1000 ? '⚠️ SLOW' : '✓'}
  - Community: ${commTime}ms ${commTime > 1000 ? '⚠️ SLOW' : '✓'}`);

    } catch (error) {
        console.error('################ HEALTH CHECK FAILED ################');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
};

checkServerHealth();
