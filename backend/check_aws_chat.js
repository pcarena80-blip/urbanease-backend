const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://51.20.34.254:5000/api';

const checkChat = async () => {
    try {
        const token = fs.readFileSync('token.txt', 'utf8');
        const headers = { Authorization: `Bearer ${token}` };

        const res = await axios.get(`${API_URL}/chat/community`, { headers });
        console.log(`Found ${res.data.length} messages.`);

        let foundAttachment = false;
        for (const msg of res.data) {
            if (msg.attachment) {
                console.log(`[ATTACHMENT] ${msg.attachment}`);
                break;
            }
        }

        if (!foundAttachment) console.log('No attachments found in history.');

    } catch (error) {
        console.error('Error:', error.message);
    }
};

checkChat();
