const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function fixAllRoles() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Set all users without admin/superadmin role to have role='user'
    const result = await User.updateMany(
        { role: { $nin: ['admin', 'superadmin'] } },
        { $set: { role: 'user' } }
    );
    console.log('Updated', result.modifiedCount, 'users to role=user');

    // List all users after fix
    const users = await User.find({}).select('name role email');
    console.log('\nAll users after fix:');
    users.forEach(u => console.log(' -', u.name, '| role:', u.role, '| email:', u.email));

    // Count users by role
    const userCount = await User.countDocuments({ role: 'user' });
    const adminCount = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } });
    console.log('\nSummary: ' + userCount + ' residents, ' + adminCount + ' admins');

    process.exit(0);
}

fixAllRoles().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
