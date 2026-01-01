const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const log = (msg) => {
    fs.appendFileSync('db_debug.txt', msg + '\n');
    console.log(msg);
};

const checkDBs = async () => {
    try {
        if (fs.existsSync('db_debug.txt')) fs.unlinkSync('db_debug.txt');

        const uri = process.env.MONGO_URI;
        if (!uri) {
            log('MONGO_URI is undefined!');
            process.exit(1);
        }
        log(`Checking URI: ${uri.substring(0, 20)}...`);

        await mongoose.connect(uri);
        log('Connected.');

        const User = require('./models/User');
        const count = await User.countDocuments();
        log(`Users in Atlas DB: ${count}`);

        const users = await User.find({}).limit(10);
        users.forEach(u => log(`- ${u.name} (${u.email}) [Role: ${u.role}]`));

        process.exit();
    } catch (error) {
        log(`Error: ${error.message}`);
        process.exit(1);
    }
};

checkDBs();
