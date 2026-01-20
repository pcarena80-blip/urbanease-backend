const axios = require('axios');

const BASE_URL = 'http://51.20.34.254:5000/api';

const verifyBackend = async () => {
    console.log('VERIFYING BACKEND IS RESPONDING CORRECTLY');
    console.log('='.repeat(60));

    try {
        // Login
        console.log('[1] Login...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@urbanease.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        const myId = loginRes.data._id;
        console.log('    Logged in as:', loginRes.data.name);
        console.log('    My ID:', myId);

        // Get inbox
        console.log('\n[2] Get inbox...');
        const inboxRes = await axios.get(`${BASE_URL}/chat/inbox`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('    Inbox:', inboxRes.data.length, 'contacts');

        if (inboxRes.data.length === 0) {
            console.log('    No contacts - will send to self or create one');

            // Try sending to self - should fail but will create conversation
            try {
                await axios.post(`${BASE_URL}/chat`, {
                    receiverId: myId, // Send to self
                    message: 'Test to self ' + Date.now()
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (e) { }

            // Refetch inbox
            const inbox2 = await axios.get(`${BASE_URL}/chat/inbox`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('    After self-send inbox:', inbox2.data.length, 'contacts');

            if (inbox2.data.length > 0) {
                inboxRes.data = inbox2.data;
            }
        }

        if (inboxRes.data.length > 0) {
            const contact = inboxRes.data[0];
            console.log('\n[3] Testing with contact:', contact.name, 'ID:', contact.id);

            // Get messages - this is the critical test
            console.log('\n[4] GET /chat/' + contact.id + ' ...');
            const messagesRes = await axios.get(`${BASE_URL}/chat/${contact.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('    Response status:', messagesRes.status);
            console.log('    Response type:', typeof messagesRes.data);
            console.log('    Is Array:', Array.isArray(messagesRes.data));
            console.log('    Length:', messagesRes.data?.length);

            if (messagesRes.data && messagesRes.data.length > 0) {
                console.log('\n[5] MESSAGES FOUND! Listing first 2:');
                messagesRes.data.slice(0, 2).forEach((msg, idx) => {
                    console.log(`    [${idx}] id=${msg.id}, sender=${msg.sender}, msg="${(msg.message || '').substring(0, 40)}"`);
                });
                console.log('\n✅ BACKEND IS WORKING CORRECTLY');
                console.log('   If messages dont show in app, issue is 100% FRONTEND');
            } else {
                console.log('\n⚠️ No messages in this conversation');
            }

            // Send a test message
            console.log('\n[6] Sending test message...');
            const sendRes = await axios.post(`${BASE_URL}/chat`, {
                receiverId: contact.id,
                message: 'Frontend Debug Test ' + new Date().toISOString()
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('    Send status:', sendRes.status);
            console.log('    Send response id:', sendRes.data?.id);

            // Fetch again
            console.log('\n[7] Re-fetching messages...');
            const msgs2 = await axios.get(`${BASE_URL}/chat/${contact.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('    Now have:', msgs2.data.length, 'messages');
            console.log('    Last message:', msgs2.data[msgs2.data.length - 1]?.message?.substring(0, 50));
        }

        console.log('\n' + '='.repeat(60));
        console.log('VERIFICATION COMPLETE');

    } catch (error) {
        console.error('ERROR:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
};

verifyBackend();
