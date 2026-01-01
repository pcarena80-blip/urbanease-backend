const mongoose = require('mongoose');
const User = require('./models/User');
const Bill = require('./models/Bill');
const Complaint = require('./models/Complaint');
const ChatMessage = require('./models/ChatMessage');
const Notice = require('./models/Notice');
const dotenv = require('dotenv');

dotenv.config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Count Users
        const userCount = await User.countDocuments({});
        console.log(`TOTAL USERS: ${userCount}`);

        // List first 5 users to verify identities
        const users = await User.find({}).limit(5).select('name email');
        console.log('FIRST 5 USERS:', users);

        // Count Bills
        const billCount = await Bill.countDocuments({});
        console.log(`TOTAL BILLS: ${billCount}`);

        // Count Complaints
        const complaintCount = await Complaint.countDocuments({});
        console.log(`TOTAL COMPLAINTS: ${complaintCount}`);

        // Count Messages
        const messageCount = await ChatMessage.countDocuments({});
        console.log(`TOTAL MESSAGES: ${messageCount}`);

        // Count Notices
        const noticeCount = await Notice.countDocuments({});
        console.log(`TOTAL NOTICES: ${noticeCount}`);

        // Show recent notices
        const notices = await Notice.find({}).sort({ createdAt: -1 }).limit(3);
        console.log('RECENT NOTICES:', notices);

    } catch (error) {
        console.error(`Error: ${error.message}`);
    } finally {
        process.exit();
    }
};

checkData();
