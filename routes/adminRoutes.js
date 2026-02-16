const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Bill = require('../models/Bill');

// Get all users
router.get('/users', protect, adminMiddleware, async (req, res) => {
    try {
        // Fetch users where role is 'user' OR role is missing/undefined
        // This implicitly excludes 'admin' and 'superadmin'
        const users = await User.find({
            $or: [
                { role: 'user' },
                { role: { $exists: false } },
                { role: null }
            ]
        }).select('-password');

        console.log(`API /users: Found ${users.length} residents.`);
        users.forEach(u => console.log(` - Sending: ${u.name} (${u.email}) [Role: ${u.role}]`));

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify user
router.put('/users/:id/verify', protect, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isVerified = true;
            await user.save();
            res.json({ message: 'User verified successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user
router.delete('/users/:id', protect, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            console.log(`Admin deleted user: ${user.email}`);
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all complaints
router.get('/complaints', protect, adminMiddleware, async (req, res) => {
    try {
        const complaints = await Complaint.find().populate('userId', 'name email block houseNo');
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update complaint status
router.put('/complaints/:id/status', protect, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (complaint) {
            complaint.status = status;
            if (status === 'resolved') {
                complaint.response = 'Resolved by Admin';
            }
            await complaint.save();

            // Notify user via Socket.IO if connected
            if (req.io) {
                req.io.to('community').emit('complaint_updated', {
                    complaintId: complaint._id,
                    status: status
                });
            }

            res.json(complaint);
        } else {
            res.status(404).json({ message: 'Complaint not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

const Notice = require('../models/Notice');

// Get all bills
router.get('/bills', protect, adminMiddleware, async (req, res) => {
    try {
        const bills = await Bill.find().populate('userId', 'name');
        res.json(bills);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update bill status
router.put('/bills/:id/status', protect, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const bill = await Bill.findById(req.params.id);
        if (bill) {
            bill.status = status;
            if (status === 'paid') {
                bill.paidDate = Date.now();
            } else {
                bill.paidDate = undefined; // Reset if marked unpaid
            }
            await bill.save();
            res.json(bill);
        } else {
            res.status(404).json({ message: 'Bill not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Dispatch Monthly Bills (Generate bills for all residents)
router.post('/bills/dispatch', protect, adminMiddleware, async (req, res) => {
    try {
        const { month, type, amount, dueDate } = req.body; // e.g., 'January 2025', 'Maintenance', 5000, '2025-01-15'

        if (!month || !type || !amount || !dueDate) {
            return res.status(400).json({ message: 'Please provide month, type, amount, and due date' });
        }

        const residents = await User.find({ role: 'user', isVerified: true });
        const billsCreated = [];

        for (const resident of residents) {
            // Check if bill already exists for this user, month, and type
            const existingBill = await Bill.findOne({
                userId: resident._id,
                month,
                type
            });

            if (!existingBill) {
                const newBill = await Bill.create({
                    userId: resident._id,
                    type,
                    amount,
                    dueDate,
                    month,
                    refNo: `${type.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    status: 'due'
                });
                billsCreated.push(newBill);
            }
        }

        res.json({ message: `Generated ${billsCreated.length} bills`, bills: billsCreated });
    } catch (error) {
        console.error('Dispatch Error:', error);
        res.status(500).json({ message: 'Server error generating bills' });
    }
});

// Get Dashboard Stats
router.get('/stats', protect, adminMiddleware, async (req, res) => {
    try {
        // Users Stats
        const totalResidents = await User.countDocuments({ role: 'user' });
        const activeResidents = await User.countDocuments({ role: 'user', isVerified: true });

        // Complaint Stats
        const activeComplaints = await Complaint.countDocuments({ status: 'in-progress' });
        const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });

        // Bill Stats
        const billsDue = await Bill.aggregate([
            { $match: { status: 'unpaid' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalBillsDue = billsDue.length > 0 ? billsDue[0].total : 0;
        const unpaidBillsCount = await Bill.countDocuments({ status: 'unpaid' });

        // Notice Stats
        const activeNotices = await Notice.countDocuments({ expiryDate: { $gte: new Date() } });

        // Complaint Resolution Data (Dummy logic for graph for now, or aggregate by createdAt)
        // For simplicity, we'll return static graph data but real counts
        // To do real graph: would need aggregation of changes or creation dates. 
        // Let's rely on frontend for graph (or keep static graph until complex aggregation is needed).
        // For now, let's send what we have.

        res.json({
            totalResidents,
            activeResidents,
            activeComplaints,
            pendingComplaints,
            totalBillsDue,
            unpaidBillsCount,
            activeNotices
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching stats' });
    }
});

// Get Graph Data
router.get('/stats/graphs', protect, adminMiddleware, async (req, res) => {
    try {
        // Activity Data (Last 24 Hours)
        // Group by hour
        const activityData = [];
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hour = time.getHours();
            const timeLabel = `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`;

            // Real data aggregation would go here. For now, we mock realistic data
            // In a real app, you'd aggregate User.find({ lastLogin: ... }) and Complaint.find({ createdAt: ... })
            activityData.push({
                time: timeLabel,
                logins: Math.floor(Math.random() * 10) + 2,
                complaints: Math.floor(Math.random() * 5),
                activity: Math.floor(Math.random() * 15) + 5
            });
        }

        // Resolution Data (Last 7 Days)
        const resolutionData = [];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayLabel = days[date.getDay()];

            resolutionData.push({
                day: dayLabel,
                resolved: Math.floor(Math.random() * 8) + 1,
                pending: Math.floor(Math.random() * 5) + 1
            });
        }

        res.json({
            activityData,
            resolutionData
        });

    } catch (error) {
        console.error("Error fetching graph data:", error);
        res.status(500).json({ message: 'Server error fetching graph data' });
    }
});

// NOTICE ROUTES

// Get active (non-expired) notices
router.get('/notices', protect, adminMiddleware, async (req, res) => {
    try {
        const notices = await Notice.find({ expiryDate: { $gte: new Date() } }).sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get expired notices (history)
router.get('/notices/history', protect, adminMiddleware, async (req, res) => {
    try {
        const notices = await Notice.find({ expiryDate: { $lt: new Date() } }).sort({ expiryDate: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create notice
const upload = require('../middleware/uploadMiddleware');
router.post('/notices', protect, adminMiddleware, upload.single('file'), async (req, res) => {
    try {
        const { title, description, expiryDate } = req.body;
        console.log('📌 Notice creation - file:', req.file ? req.file.filename : 'NO FILE');
        console.log('📌 Notice creation - body:', { title, description, expiryDate });
        const notice = await Notice.create({
            title,
            description,
            expiryDate,
            attachment: req.file ? `uploads/${req.file.filename}` : null
        });
        console.log('📌 Notice created:', { id: notice._id, attachment: notice.attachment });

        // Notify users via Socket.IO
        if (req.io) {
            req.io.to('community').emit('new_announcement', notice);
        }

        res.status(201).json(notice);
    } catch (error) {
        console.error('📌 Notice creation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete notice
router.delete('/notices/:id', protect, adminMiddleware, async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (notice) {
            await notice.deleteOne();
            res.json({ message: 'Notice removed' });
        } else {
            res.status(404).json({ message: 'Notice not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// SUPER ADMIN ROUTES: Admin Management

const superAdminMiddleware = require('../middleware/superAdminMiddleware');

// Get all admins
router.get('/admins', protect, superAdminMiddleware, async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new admin
router.post('/admins', protect, superAdminMiddleware, async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await require('bcryptjs').genSalt(10);
        const hashedPassword = await require('bcryptjs').hash(password, salt);

        const admin = await User.create({
            name,
            email,
            phone: phone || '',
            password: hashedPassword,
            role: 'admin',
            isVerified: true
        });

        res.status(201).json({
            _id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete admin
router.delete('/admins/:id', protect, superAdminMiddleware, async (req, res) => {
    try {
        const admin = await User.findById(req.params.id);
        if (admin && admin.role === 'admin') {
            await admin.deleteOne();
            res.json({ message: 'Admin removed' });
        } else {
            res.status(404).json({ message: 'Admin not found or not an admin' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
