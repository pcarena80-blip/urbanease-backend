const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs'); // Import bcrypt
const User = require('./models/User');
const Bill = require('./models/Bill');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const seedData = async () => {
    try {
        await User.deleteMany();
        await Bill.deleteMany();

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            phone: '1234567890',
            password: hashedPassword // Use hashed password
        });

        console.log('User created:', user.name);

        const bills = [
            {
                userId: user._id,
                type: 'Electricity',
                amount: 4500,
                dueDate: '25 Dec 2024',
                month: 'December 2024',
                refNo: 'ELEC-123456',
                status: 'due'
            },
            {
                userId: user._id,
                type: 'Gas',
                amount: 1200,
                dueDate: '20 Dec 2024',
                month: 'December 2024',
                refNo: 'GAS-789012',
                status: 'due'
            },
            {
                userId: user._id,
                type: 'Internet',
                amount: 3000,
                dueDate: '05 Jan 2025',
                month: 'January 2025',
                refNo: 'NET-345678',
                status: 'upcoming'
            },
            {
                userId: user._id,
                type: 'Water',
                amount: 800,
                dueDate: '15 Nov 2024',
                month: 'November 2024',
                refNo: 'WAT-901234',
                status: 'paid',
                method: 'Credit Card',
                paidDate: new Date('2024-11-14')
            }
        ];

        // Seed Community Messages
        const communityMessages = [
            {
                senderId: user._id,
                receiverId: 'community',
                message: 'Welcome to the Urban East Community!',
                timestamp: new Date()
            },
            {
                senderId: user._id,
                receiverId: 'community',
                message: 'This is a test message for everyone.',
                timestamp: new Date(Date.now() + 1000)
            }
        ];

        // Import ChatMessage model locally if not at top, or assume it's available
        const ChatMessage = require('./models/ChatMessage');
        await ChatMessage.deleteMany({}); // Clear old chats
        await ChatMessage.insertMany(communityMessages);

        await Bill.insertMany(bills);

        console.log('Bills created');

        console.log('Database seeded! Please refresh MongoDB Compass.');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
