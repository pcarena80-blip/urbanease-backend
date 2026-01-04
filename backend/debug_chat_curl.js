const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');

const API_URL = 'http://51.20.34.254:5000/api';

const debugChat = async () => {
    try {
        console.log('--- Debugging AWS Chat with Curl ---');
        // Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@urbanease.com',
            password: 'pakistan123'
        });
        const token = loginRes.data.token;
        console.log('Login Token Recieved');

        // Execute Curl
        // Using "curl" command (Windows might use Invoke-WebRequest unless .exe specified or logic handled)
        // Command: curl -v -X POST -H "Authorization: Bearer <token>" -F "receiverId=community" -F "message=Curl Node Test" URL
        const curlCmd = `curl -v -X POST -H "Authorization: Bearer ${token}" -F "receiverId=community" -F "message=Curl Node Test" ${API_URL}/chat`;

        console.log('Running Curl Command...');
        exec(curlCmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Curl Error: ${error.message}`);
                return;
            }
            if (stderr) console.error(`Stderr: ${stderr}`); // Curl -v writes to stderr
            console.log(`Stdout: ${stdout}`);
        });

    } catch (error) {
        console.error('Fatal Error:', error.message);
    }
};

debugChat();
