const Bill = require('../models/Bill');
const User = require('../models/User');

// @desc    Dispatch monthly bills to all verified residents
// @route   POST /api/bills/dispatch
// @access  Admin
exports.dispatchBills = async (req, res) => {
    const { types, month, dueDate } = req.body;

    if (!types || !Array.isArray(types) || types.length === 0 || !month || !dueDate) {
        return res.status(400).json({ message: 'Please provide bill types, month, and due date' });
    }

    try {
        // Get all verified residents
        const residents = await User.find({ isVerified: true, role: { $ne: 'admin' } });

        if (residents.length === 0) {
            return res.status(400).json({ message: 'No verified residents found' });
        }

        let createdBills = 0;
        let skippedBills = 0;

        for (const resident of residents) {
            for (const type of types) {
                // Check if bill already exists for this resident, type, and month
                const existingBill = await Bill.findOne({
                    consumerId: resident._id,
                    type: type,
                    month: month
                });

                if (existingBill) {
                    skippedBills++;
                    continue;
                }

                // Generate random amount based on type
                let amount;
                switch (type) {
                    case 'electricity':
                        amount = Math.floor(Math.random() * 3000) + 2000; // 2000-5000
                        break;
                    case 'gas':
                        amount = Math.floor(Math.random() * 1500) + 500; // 500-2000
                        break;
                    case 'maintenance':
                        amount = 1500; // Fixed maintenance fee
                        break;
                    default:
                        amount = 1000;
                }

                // Create the bill
                await Bill.create({
                    consumerId: resident._id,
                    type: type,
                    amount: amount,
                    month: month,
                    dueDate: new Date(dueDate),
                    status: 'unpaid',
                    refNo: `${type.toUpperCase().substring(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
                });

                createdBills++;
            }
        }

        res.status(201).json({
            message: `Dispatched ${createdBills} bills successfully`,
            created: createdBills,
            skipped: skippedBills,
            residents: residents.length
        });

    } catch (error) {
        console.error('Dispatch error:', error);
        res.status(500).json({ message: 'Dispatch failed: ' + error.message });
    }
};

// @desc    Get all bills (Admin or User's own)
// @route   GET /api/bills
// @access  Private
exports.getAllBills = async (req, res) => {
    try {
        const bills = await Bill.find({}).sort({ dueDate: 1 });
        res.status(200).json(bills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search Bill by Consumer ID (Bill ID)
// @route   GET /api/bills/search/:consumerId
// @access  Public (User needs to find bill to pay)
exports.getBillById = async (req, res) => {
    try {
        const { consumerId } = req.params;
        const bill = await Bill.findOne({ consumerId: consumerId });

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found. Please check Consumer ID.' });
        }
        res.status(200).json(bill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Pay Bill (Simulated JazzCash/EasyPaisa)
// @route   POST /api/bills/pay
// @access  Private
exports.payBill = async (req, res) => {
    const { billId, phoneNumber, provider } = req.body;

    // 1. Validate Phone Number
    const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: 'Invalid phone number. Must be 11 digits starting with 03.' });
    }

    try {
        const bill = await Bill.findById(billId);
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        if (bill.status === 'paid') {
            return res.status(400).json({ message: 'This bill is already paid.' });
        }

        // 2. Simulate Payment Gateway success
        // In real world, we would call JazzCash API here using bill.refNo

        // 3. Update Bill
        bill.status = 'paid';
        bill.paidDate = Date.now();
        bill.method = provider || 'Online';
        bill.payerPhone = phoneNumber;

        await bill.save();

        res.status(200).json({
            message: 'Payment Successful',
            refId: bill.refNo,
            transactionId: 'TXN-' + Date.now(),
            bill
        });

    } catch (error) {
        res.status(500).json({ message: 'Payment failed: ' + error.message });
    }
};

// @desc    Legacy Update (kept for compatibility)
exports.updateBill = async (req, res) => {
    res.status(400).json({ message: 'Use /pay endpoint for payments' });
};
