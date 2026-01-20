const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Bill = require('../models/Bill');
const ChatMessage = require('../models/ChatMessage');
const Carpool = require('../models/CarpoolModel');
const Notice = require('../models/Notice');
const LoginHistory = require('../models/LoginHistory'); // ADDED: For graphs API

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

// Delete user (with cascade delete of related data)
router.delete('/users/:id', protect, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = user._id;

        // Cascade delete all related data
        const complaintsDeleted = await Complaint.deleteMany({ userId });
        const messagesDeleted = await ChatMessage.deleteMany({
            $or: [
                { senderId: userId },
                { receiverId: userId.toString() }
            ]
        });
        const carpoolsDeleted = await Carpool.deleteMany({ provider: userId });
        const billsDeleted = await Bill.deleteMany({ userId });

        await user.deleteOne();

        console.log(`Admin deleted user: ${user.email} (Complaints: ${complaintsDeleted.deletedCount}, Messages: ${messagesDeleted.deletedCount}, Carpools: ${carpoolsDeleted.deletedCount}, Bills: ${billsDeleted.deletedCount})`);

        res.json({
            message: 'User and all associated data removed',
            deleted: {
                complaints: complaintsDeleted.deletedCount,
                messages: messagesDeleted.deletedCount,
                carpools: carpoolsDeleted.deletedCount,
                bills: billsDeleted.deletedCount
            }
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Toggle user chat block status
router.put('/users/:id/chat-block', protect, adminMiddleware, async (req, res) => {
    try {
        const { block } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isChatBlocked = block;
        await user.save();

        console.log(`Admin ${block ? 'blocked' : 'unblocked'} user from chat: ${user.email}`);

        res.json({
            message: block ? 'User blocked from chat' : 'User unblocked from chat',
            isChatBlocked: user.isChatBlocked
        });
    } catch (error) {
        console.error('Error toggling chat block:', error);
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
            // Lifecycle validation: prevent invalid status transitions
            if ((complaint.status === 'resolved' || complaint.status === 'rejected') && status === 'cancelled') {
                return res.status(400).json({ message: 'Cannot cancel a resolved or rejected complaint' });
            }

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

        // Noise Complaints (active only - pending or in-progress)
        const noiseComplaints = await Complaint.countDocuments({
            category: { $in: ['Noise', 'Noise Complaint'] },
            status: { $in: ['pending', 'in-progress'] }
        });

        // Notice Stats
        const activeNotices = await Notice.countDocuments({ expiryDate: { $gte: new Date() } });

        res.json({
            totalResidents,
            activeResidents,
            activeComplaints,
            pendingComplaints,
            noiseComplaints,
            activeNotices
        });

    } catch (error) {
        console.error('Stats fetch error:', error);
        // Return default "zero" stats instead of crashing the dashboard
        res.json({
            totalResidents: 0,
            activeResidents: 0,
            activeComplaints: 0,
            pendingComplaints: 0,
            noiseComplaints: 0,
            activeNotices: 0
        });
    }
});

// Get Dashboard Graph Data (Real-time aggregation)
router.get('/stats/graphs', protect, adminMiddleware, async (req, res) => {
    try {
        const now = new Date();

        // --- Activity Data (Last 24 Hours by 4-hour intervals) ---
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
            },
            { $sort: { '_id.interval': 1 } }
        ];

        const loginAggregation = await LoginHistory.aggregate(activityPipeline);
        console.log('[DEBUG] Login Aggregation result:', JSON.stringify(loginAggregation));

        // Complaints created in last 24 hours by interval
        const complaintActivityPipeline = [
            { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
            {
                $group: {
                    _id: {
                        interval: {
                            $multiply: [{ $floor: { $divide: [{ $hour: '$createdAt' }, 4] } }, 4]
                        }
                    },
                    complaints: { $sum: 1 }
                }
            },
            { $sort: { '_id.interval': 1 } }
        ];

        const complaintActivity = await Complaint.aggregate(complaintActivityPipeline);
        console.log('[DEBUG] Complaint Aggregation result:', JSON.stringify(complaintActivity));

        // Build activity data for chart (6 intervals: 0, 4, 8, 12, 16, 20)
        const timeLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
        const activityData = timeLabels.map((time, idx) => {
            const intervalHour = idx * 4;
            const loginData = loginAggregation.find(l => l._id.interval === intervalHour);
            const complaintData = complaintActivity.find(c => c._id.interval === intervalHour);
            return {
                time,
                logins: loginData ? loginData.logins : 0,
                complaints: complaintData ? complaintData.complaints : 0,
                activity: (loginData ? loginData.logins : 0) + (complaintData ? complaintData.complaints : 0) * 2
            };
        });

        // --- Resolution Data (Last 7 Days) ---
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const resolutionPipeline = [
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: {
                        dayOfWeek: { $dayOfWeek: '$createdAt' },
                        status: '$status'
                    },
                    count: { $sum: 1 }
                }
            }
        ];

        const resolutionAggregation = await Complaint.aggregate(resolutionPipeline);

        // Day mapping (MongoDB: 1=Sunday, 2=Monday, etc.)
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const resolutionData = dayNames.map((day, idx) => {
            const dayOfWeek = idx + 1;
            const resolved = resolutionAggregation.find(r => r._id.dayOfWeek === dayOfWeek && r._id.status === 'resolved');
            const pending = resolutionAggregation.find(r => r._id.dayOfWeek === dayOfWeek && r._id.status === 'pending');
            const inProgress = resolutionAggregation.find(r => r._id.dayOfWeek === dayOfWeek && r._id.status === 'in-progress');
            return {
                day,
                resolved: resolved ? resolved.count : 0,
                pending: (pending ? pending.count : 0) + (inProgress ? inProgress.count : 0)
            };
        });

        res.json({
            activityData,
            resolutionData
        });

    } catch (error) {
        console.error('Graph aggregation error:', error);
        // Return clear empty structure instead of crashing
        res.json({
            activityData: [],
            resolutionData: []
        });
    }
});

// NOTICE ROUTES

// Get all ACTIVE notices (not expired)
router.get('/notices', protect, adminMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const notices = await Notice.find({ expiryDate: { $gte: now } }).sort({ createdAt: -1 });
        console.log(`[GET] Returning ${notices.length} notices. IDs:`, notices.map(n => n.id));
        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ... (skipping history route)

// Delete notice
router.delete('/notices/:id', protect, adminMiddleware, async (req, res) => {
    try {
        console.log('[DELETE] Attempting to delete notice:', req.params.id);
        const notice = await Notice.findByIdAndDelete(req.params.id);

        if (notice) {
            console.log('[DELETE] Notice deleted successfully');
            res.json({ message: 'Notice removed' });
        } else {
            console.log('[DELETE] Notice not found in DB');
            res.status(404).json({ message: 'Notice not found in database. Please refresh.' });
        }
    } catch (error) {
        console.error('[DELETE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get EXPIRED notices (History)
router.get('/notices/history', protect, adminMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const expiredNotices = await Notice.find({ expiryDate: { $lt: now } }).sort({ expiryDate: -1 });
        res.json(expiredNotices);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create notice (with expiry validation)
// Replace POST /notices logic
// Create notice (with expiry validation)
// Replace POST /notices logic
router.post('/notices', protect, adminMiddleware, require('../middleware/uploadMiddleware').single('file'), async (req, res) => {
    try {
        console.log('[CREATE] Attempting to create notice:', req.body);
        const { title, description, expiryDate } = req.body;

        // Validate expiry date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        if (expiry < today) {
            return res.status(400).json({ message: 'Expiry date cannot be in the past' });
        }

        const noticeData = {
            title,
            description,
            expiryDate
        };

        if (req.file) {
            // Store the relative path (uploads/filename)
            // req.file.path gives absolute path, so we use req.file.filename and prepend directory
            noticeData.attachment = 'uploads/' + req.file.filename;
            console.log('Saving notice attachment:', noticeData.attachment);
        }

        const notice = await Notice.create(noticeData);

        // Notify users via Socket.IO
        if (req.io) {
            req.io.to('community').emit('new_announcement', notice);
        }

        res.status(201).json(notice);
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
