const axios = require('axios');

const BASE_URL = 'http://51.20.34.254:5000/api';

async function checkServer() {
    console.log(`Checking AWS Server at: ${BASE_URL}`);

    try {
        // 1. Check Root/Health
        try {
            const root = await axios.get('http://51.20.34.254:5000/');
            console.log('✅ Server Root is Reachable:', root.data);
        } catch (e) {
            console.log('❌ Server Root Unreachable:', e.message);
            return; // If root is down, nothing else matters
        }

        // 2. Check Carpool Route (New Feature)
        try {
            await axios.get(`${BASE_URL}/carpool`);
            console.log('✅ /api/carpool exists (Backend is UPDATED)');
        } catch (e) {
            if (e.response && e.response.status === 404) {
                console.log('❌ /api/carpool returned 404 (Backend is OUTDATED)');
            } else {
                console.log('⚠️ Error checking carpool:', e.message);
            }
        }

    } catch (error) {
        console.error('Fatal Error:', error.message);
    }
}

checkServer();
