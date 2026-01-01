const fetch = require('node-fetch') || global.fetch; // Use native fetch if available

const BASE_URL = 'https://certification-democrat-foam-counters.trycloudflare.com/api';

async function probe() {
    console.log(`Probing ${BASE_URL}...`);
    try {
        const res = await fetch(BASE_URL);
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text.substring(0, 200));

        if (res.status === 502) {
            console.log('ERROR: Cloudflare Bad Gateway (Tunnel issue / Server down)');
        }
    } catch (error) {
        console.error('Network Error:', error.message);
    }
}

probe();
