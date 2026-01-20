const axios = require('axios');

const BASE_URL = 'http://51.20.34.254:5000/api';

const testPrivateChat = async () => {
    console.log('[PROBE] Testing Private Chat...');

    try {
        // Login
        console.log('[1] Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@urbanease.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        const myId = loginRes.data._id;
        console.log('[1] Login OK. My ID:', myId);

        // Get inbox to find a chat
        console.log('[2] Getting inbox...');
        const inboxRes = await axios.get(`${BASE_URL}/chat/inbox`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('[2] Inbox:', JSON.stringify(inboxRes.data, null, 2));

        // If no chats exist, we need another user to chat with
        if (inboxRes.data.length === 0) {
            console.log('[!] No existing chats. Trying to get list of users...');
            // Try to get users list
            const usersRes = await axios.get(`${BASE_URL}/residents`, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => null);

            if (usersRes && usersRes.data.length > 0) {
                const otherUser = usersRes.data.find(u => u._id !== myId);
                if (otherUser) {
                    console.log('[!] Found user to chat with:', otherUser.name, otherUser._id);

                    // Send a test message
                    console.log('[3] Sending test message...');
                    const sendRes = await axios.post(`${BASE_URL}/chat`, {
                        receiverId: otherUser._id,
                        message: 'Test private message from probe script'
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('[3] Message Sent:', sendRes.data);
                }
            } else {
                console.log('[!] Cannot find other users. Create another user first.');
            }
        } else {
            // Use first chat
            const chat = inboxRes.data[0];
            console.log('[3] Using chat with:', chat.name, chat.id);

            // Send a test message
            console.log('[4] Sending test message...');
            const sendRes = await axios.post(`${BASE_URL}/chat`, {
                receiverId: chat.id,
                message: 'Test private message from probe ' + new Date().toISOString()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('[4] Message Sent:', JSON.stringify(sendRes.data, null, 2));
        }

    } catch (error) {
        console.error('################ PROBE FAILED ################');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
};

testPrivateChat();
