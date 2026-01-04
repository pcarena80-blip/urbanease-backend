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
// Delete bill
router.delete('/bills/:id', protect, adminMiddleware, async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);
        if (bill) {
            await bill.deleteOne();
            res.json({ message: 'Bill removed' });
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
        const { month, types, dueDate } = req.body; // types is an array like ['electricity', 'gas', 'maintenance']

        if (!month || !types || !Array.isArray(types) || types.length === 0 || !dueDate) {
            return res.status(400).json({ message: 'Please provide month, types (array), and dueDate' });
        }

        const residents = await User.find({ role: 'user' });
        console.log(`[DISPATCH] Found ${residents.length} residents with role 'user'.`);

        if (residents.length === 0) {
            console.log('[DISPATCH] No residents found. Aborting.');
            return res.status(400).json({ message: 'No registered residents found' });
        }

        let createdCount = 0;
        let skippedCount = 0;

        for (const resident of residents) {
            for (const type of types) {
                // Normalize type to lowercase for consistent handling
                const normalizedType = type.toLowerCase();

                // Generate unique IDs
                const timestamp = Date.now();
                const randomNum = Math.floor(Math.random() * 10000);
                const uniqueBillId = `${normalizedType.toUpperCase().substring(0, 2)}-${timestamp}-${randomNum}`;
                const uniqueRefId = `REF-${timestamp}-${randomNum}`;

                // Check if bill already exists for this user, month, and type
                const existingBill = await Bill.findOne({
                    userId: resident._id,
                    billingMonth: month,
                    type: normalizedType
                });

                if (existingBill) {
                    skippedCount++;
                    continue;
                }

                // Generate amount based on type
                let amount;
                let provider;
                switch (normalizedType) {
                    case 'electricity':
                        amount = Math.floor(Math.random() * 3000) + 2000;
                        provider = 'IESCO';
                        break;
                    case 'gas':
                        amount = Math.floor(Math.random() * 1500) + 500;
                        provider = 'SNGPL';
                        break;
                    case 'maintenance':
                        amount = 1500;
                        provider = 'Urban Ease Residency';
                        break;
                    default:
                        amount = 1000;
                        provider = 'Urban Ease';
                }

                await Bill.create({
                    userId: resident._id,
                    consumerId: resident._id.toString(),
                    type: normalizedType,
                    provider,
                    billId: uniqueBillId,
                    referenceId: uniqueRefId,
                    amount,
                    dueDate,
                    billingMonth: month,
                    status: 'due',
                    consumerName: resident.name,
                    address: resident.block ? `${resident.block}, ${resident.street}, ${resident.houseNo}` : `${resident.plazaName || ''}, Floor ${resident.floorNumber || ''}, Flat ${resident.flatNumber || ''}`
                });
                createdCount++;
            }
        }

        res.json({
            message: `Generated ${createdCount} bills (${skippedCount} skipped as duplicates)`,
            created: createdCount,
            skipped: skippedCount
        });
    } catch (error) {
        console.error('Dispatch Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
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

// NOTICE ROUTES

// Get all notices
router.get('/notices', protect, adminMiddleware, async (req, res) => {
    try {
        const notices = await Notice.find().sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create notice
router.post('/notices', protect, adminMiddleware, async (req, res) => {
    try {
        const { title, description, expiryDate } = req.body;
        const notice = await Notice.create({
            title,
            description,
            expiryDate
        });

        // Notify users via Socket.IO
        if (req.io) {
            req.io.to('community').emit('new_announcement', notice);
        }

        res.status(201).json(notice);
    } catch (error) {
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
