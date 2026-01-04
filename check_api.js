const BASE_URL = 'https://site-enclosure-momentum-andy.trycloudflare.com';

async function check(path) {
    try {
        console.log(`Checking ${path}...`);
        const res = await fetch(`${BASE_URL}${path}`);
        console.log(`✅ ${path}: ${res.status} ${res.statusText}`);
    } catch (error) {
        console.log(`❌ ${path}: Network Error (${error.message})`);
    }
}

async function run() {
    await check('/');
    await check('/api/auth');
    await check('/api/admin/users');
    await check('/api/bills');
}

run();
