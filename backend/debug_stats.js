const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Notice = require('./models/Notice');
const LoginHistory = require('./models/LoginHistory');

dotenv.config();

const checkStats = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/urbanease');
        console.log('Connected to DB');

        const totalResidents = await User.countDocuments({ role: 'user' });
        console.log('Total Residents:', totalResidents);

        const activeResidents = await User.countDocuments({ role: 'user', isVerified: true });
        console.log('Active Residents:', activeResidents);

        const activeComplaints = await Complaint.countDocuments({ status: 'in-progress' });
        console.log('Active Complaints:', activeComplaints);

        const loginHistoryCount = await LoginHistory.countDocuments();
        console.log('Login History Count:', loginHistoryCount);

        // Test Aggregation
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const activityPipeline = [
            { $match: { loginTime: { $gte: twentyFourHoursAgo } } },
            {
                $group: {
                    _id: {
                        interval: {
                            $multiply: [{ $floor: { $divide: [{ $hour: '$loginTime' }, 4] } }, 4]
                        }
                    },
                    logins: { $sum: 1 }
                }
            }
        ];

        const loginAggregation = await LoginHistory.aggregate(activityPipeline);
        console.log('Login Aggregation:', JSON.stringify(loginAggregation));

        if (loginAggregation.length === 0) {
            console.log("Login Aggregation is EMPTY. This is valid, but checking if it caused issues.");
        }

        process.exit(0);
    } catch (error) {
        console.error('Error during stats check:', error);
        process.exit(1);
    }
};

checkStats();
