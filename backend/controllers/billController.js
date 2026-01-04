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
        // Get all verified residents (exclude admin and superadmin)
        const residents = await User.find({ isVerified: true, role: 'user' });

        if (residents.length === 0) {
            return res.status(400).json({ message: 'No verified residents found' });
        }

        let createdBills = 0;
        let skippedBills = 0;

        for (const resident of residents) {
            for (const type of types) {
                // Generate unique IDs
                const timestamp = Date.now();
                const randomNum = Math.floor(Math.random() * 10000);
                const uniqueBillId = `${type.toUpperCase().substring(0, 2)}-${timestamp}-${randomNum}`;
                const uniqueRefId = `REF-${timestamp}-${randomNum}`;
                const consumerIdStr = resident._id.toString();

                // Check if bill already exists for this resident, type, and month
                const existingBill = await Bill.findOne({
                    userId: resident._id,
                    type: type,
                    billingMonth: month
                });

                if (existingBill) {
                    skippedBills++;
                    continue;
                }

                // Generate random amount based on type
                let amount;
                let provider;
                switch (type) {
                    case 'electricity':
                        amount = Math.floor(Math.random() * 3000) + 2000; // 2000-5000
                        provider = 'IESCO';
                        break;
                    case 'gas':
                        amount = Math.floor(Math.random() * 1500) + 500; // 500-2000
                        provider = 'SNGPL';
                        break;
                    case 'maintenance':
                        amount = 1500; // Fixed maintenance fee
                        provider = 'Urban Ease Residency';
                        break;
                    default:
                        amount = 1000;
                        provider = 'Urban Ease';
                }

                // Create the bill with all required fields
                await Bill.create({
                    userId: resident._id,
                    consumerId: consumerIdStr,
                    type: type,
                    provider: provider,
                    billId: uniqueBillId,
                    referenceId: uniqueRefId,
                    amount: amount,
                    dueDate: dueDate,
                    billingMonth: month,
                    status: 'due',
                    consumerName: resident.name,
                    address: resident.block ? `${resident.block}, ${resident.street}, ${resident.houseNo}` : `${resident.plazaName}, Floor ${resident.floorNumber}, Flat ${resident.flatNumber}`
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
        // Filter bills for the logged-in user only
        const bills = await Bill.find({ userId: req.user.id }).sort({ dueDate: -1 });
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
    // Accept both field name formats for compatibility
    const billId = req.body.billId || req.body.referenceId;
    const phoneNumber = req.body.phoneNumber || req.body.mobileNumber;
    const provider = req.body.provider || req.body.paymentMethod;

    // 1. Validate Phone Number
    const phoneRegex = /^03\d{9}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: 'Invalid phone number. Must be 11 digits starting with 03.' });
    }

    if (!billId) {
        return res.status(400).json({ message: 'Bill ID or Reference ID is required.' });
    }

    try {
        // Try to find bill by _id first, then by referenceId
        let bill = await Bill.findById(billId).catch(() => null);
        if (!bill) {
            bill = await Bill.findOne({ referenceId: billId });
        }
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        if (bill.status === 'paid') {
            return res.status(400).json({ message: 'This bill is already paid.' });
        }

        const transactionId = 'TXN-' + Date.now();

        // Use findByIdAndUpdate to avoid full validation on save
        const updatedBill = await Bill.findByIdAndUpdate(
            bill._id,
            {
                $set: {
                    status: 'paid',
                    paidDate: new Date(),
                    method: provider || 'Online',
                    payerPhone: phoneNumber,
                    transactionId: transactionId
                }
            },
            { new: true, runValidators: false }
        );

        res.status(200).json({
            message: 'Payment Successful',
            refId: updatedBill.referenceId,
            transactionId: transactionId,
            bill: updatedBill
        });

    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ message: 'Payment failed: ' + error.message });
    }
};

// @desc    Legacy Update (kept for compatibility)
exports.updateBill = async (req, res) => {
    res.status(400).json({ message: 'Use /pay endpoint for payments' });
};
