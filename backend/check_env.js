const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) {
    console.log('Error loading .env:', result.error);
} else {
    console.log('.env loaded successfully.');
    // Print keys only
    console.log('Keys:', Object.keys(result.parsed));

    if (!process.env.JWT_SECRET) {
        console.error('CRITICAL: JWT_SECRET is missing!');
    } else {
        console.log('JWT_SECRET is present (length: ' + process.env.JWT_SECRET.length + ')');
    }
}
