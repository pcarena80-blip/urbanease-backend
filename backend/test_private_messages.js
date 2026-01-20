const axios = require('axios');

const BASE_URL = 'http://51.20.34.254:5000/api';

const testPrivateMessages = async () => {
    console.log('[TEST] Testing Private Chat Messages...\n');

    try {
        // Login as admin
        console.log('[1] Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@urbanease.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        const myId = loginRes.data._id;
        console.log('[1] Logged in as:', loginRes.data.name, '(ID:', myId, ')');

        // Get inbox
        console.log('\n[2] Getting inbox...');
        const inboxRes = await axios.get(`${BASE_URL}/chat/inbox`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('[2] Inbox has', inboxRes.data.length, 'chats');

        if (inboxRes.data.length > 0) {
            const chat = inboxRes.data[0];
            console.log('[2] First chat:', chat.name, '(ID:', chat.id, ')');

            // Get messages
            console.log('\n[3] Getting messages...');
            const msgRes = await axios.get(`${BASE_URL}/chat/${chat.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('[3] Got', msgRes.data.length, 'messages');

            if (msgRes.data.length > 0) {
                console.log('\n[4] Sample message structure:');
                const msg = msgRes.data[0];
                console.log(JSON.stringify(msg, null, 2));

                console.log('\n[5] Key fields check:');
                console.log('  - id:', msg.id, typeof msg.id);
                console.log('  - senderId:', msg.senderId, typeof msg.senderId);
                console.log('  - message:', msg.message ? msg.message.substring(0, 50) + '...' : 'EMPTY');
                console.log('  - timestamp:', msg.timestamp);
                console.log('  - sender:', msg.sender);
            }
        } else {
            console.log('\n[!] No private chats found. Create a chat first.');
        }

    } catch (error) {
        console.error('TEST FAILED:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
};

testPrivateMessages();
