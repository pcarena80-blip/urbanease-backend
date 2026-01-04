const fs = require('fs');

try {
    const content = fs.readFileSync('.env.bak');
    console.log('Buffer:', content);
    console.log('String:', content.toString());

    // Check for UTF-16 LE
    if (content[0] === 0xFF && content[1] === 0xFE) {
        console.log('Detected UTF-16 LE BOM');
        console.log('Decoded:', content.toString('utf16le'));
    }
} catch (e) {
    console.error(e);
}
