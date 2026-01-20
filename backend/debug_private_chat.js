const axios = require('axios');

const BASE_URL = 'http://51.20.34.254:5000/api';

const debugPrivateChat = async () => {
    console.log('P0 PRIVATE CHAT DEBUG');
    console.log('='.repeat(60));

    try {
        // Login
        console.log('[1] Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@urbanease.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        const myId = loginRes.data._id;
        console.log('    My ID:', myId);

        // Get all residents
        console.log('\n[2] Getting all residents...');
        let allUsers = [];
        try {
            const usersRes = await axios.get(`${BASE_URL}/auth/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            allUsers = usersRes.data?.users || usersRes.data || [];
            console.log('    Found', allUsers.length, 'users');
        } catch (e) {
            console.log('    /auth/users failed, trying /users...');
            try {
                const usersRes2 = await axios.get(`${BASE_URL}/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                allUsers = usersRes2.data?.users || usersRes2.data || [];
                console.log('    Found', allUsers.length, 'users');
            } catch (e2) {
                console.log('    Both endpoints failed');
            }
        }

        // Get inbox
        console.log('\n[3] Getting inbox...');
        const inboxRes = await axios.get(`${BASE_URL}/chat/inbox`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('    Inbox contacts:', inboxRes.data.length);
        inboxRes.data.forEach((c, i) => {
            console.log(`    [${i}] ${c.name} (ID: ${c.id}) - Last: "${c.lastMessage || 'N/A'}"`);
        });

        if (inboxRes.data.length === 0) {
            console.log('\n[!] NO INBOX CONTACTS - Creating test conversation...');

            // Find any other user
            const otherUser = allUsers.find(u => u._id !== myId && u._id);
            if (otherUser) {
                console.log('    Sending message to:', otherUser.name, '(ID:', otherUser._id, ')');

                // Send message
                const sendRes = await axios.post(`${BASE_URL}/chat`, {
                    receiverId: otherUser._id,
                    message: 'Test message ' + Date.now()
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('    Send response:', sendRes.status, sendRes.data?.id ? 'ID: ' + sendRes.data.id : '');

                // Re-fetch inbox
                const inbox2 = await axios.get(`${BASE_URL}/chat/inbox`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('    Inbox after send:', inbox2.data.length, 'contacts');

            } else {
                console.log('    No other user found to test with');
            }
        } else {
            // Test with first contact
            const contact = inboxRes.data[0];
            console.log('\n[4] Testing with contact:', contact.name);

            // Fetch messages
            console.log('\n[5] Fetching messages for contact ID:', contact.id);
            const msgRes = await axios.get(`${BASE_URL}/chat/${contact.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('    Got', msgRes.data.length, 'messages');

            if (msgRes.data.length > 0) {
                console.log('\n    Last 3 messages:');
                msgRes.data.slice(-3).forEach((m, i) => {
                    console.log(`    [${i}] sender=${m.sender}, senderId=${m.senderId}, msg="${m.message?.substring(0, 50) || 'ATTACHMENT'}"`);
                });
            }

            // Send new message
            const testMsg = 'Debug test ' + Date.now();
            console.log('\n[6] Sending test message:', testMsg);
            const sendRes = await axios.post(`${BASE_URL}/chat`, {
                receiverId: contact.id,
                message: testMsg
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('    Response:', sendRes.status);
            console.log('    Data:', JSON.stringify(sendRes.data, null, 2));

            // Wait and re-fetch
            console.log('\n[7] Waiting 1s then re-fetching...');
            await new Promise(r => setTimeout(r, 1000));

            const msgRes2 = await axios.get(`${BASE_URL}/chat/${contact.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('    Got', msgRes2.data.length, 'messages (was', msgRes.data.length, ')');

            const found = msgRes2.data.find(m => m.message === testMsg);
            if (found) {
                console.log('\n✅ MESSAGE FOUND - Backend works correctly');
                console.log('    Issue is in FRONTEND');
            } else {
                console.log('\n❌ MESSAGE NOT FOUND - Backend bug');
            }
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('ERROR:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
};

debugPrivateChat();
