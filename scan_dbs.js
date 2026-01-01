const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const log = (msg) => {
    fs.appendFileSync('db_debug.txt', msg + '\n');
    console.log(msg);
};

const scanDBs = async () => {
    try {
        if (fs.existsSync('db_debug.txt')) fs.unlinkSync('db_debug.txt');

        const baseUri = 'mongodb://localhost:27017';
        await mongoose.connect(`${baseUri}/admin`); // Connect to admin to list DBs

        const admin = mongoose.connection.db.admin();
        const result = await admin.listDatabases();

        await mongoose.disconnect();

        for (const dbInfo of result.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'config', 'local'].includes(dbName)) continue;

            log(`\nChecking DB: ${dbName} (Size: ${dbInfo.sizeOnDisk})`);
            try {
                const conn = await mongoose.createConnection(`${baseUri}/${dbName}`).asPromise();
                const collections = await conn.db.listCollections().toArray();

                for (const col of collections) {
                    if (col.name.toLowerCase().includes('user') || col.name.toLowerCase().includes('client') || col.name.toLowerCase().includes('resident')) {
                        const count = await conn.db.collection(col.name).countDocuments();
                        log(` - Collection: ${col.name} (Count: ${count})`);
                        if (count > 0) {
                            const samples = await conn.db.collection(col.name).find({}).limit(3).toArray();
                            samples.forEach(s => log(`   > ${s.name} (${s.email}) - Role: ${s.role}`));
                        }
                    }
                }
                await conn.close();
            } catch (err) {
                log(` - Error scanning ${dbName}: ${err.message}`);
            }
        }

        process.exit();
    } catch (error) {
        log(`Error: ${error.message}`);
        process.exit(1);
    }
};

scanDBs();
