const Bill = require('../models/Bill');

// @desc    Get bills
// @route   GET /api/bills
// @access  Private
const getBills = async (req, res) => {
    const bills = await Bill.find({ userId: req.user.id });
    res.status(200).json(bills);
};

// @desc    Set bill
// @route   POST /api/bills
// @access  Private
const setBill = async (req, res) => {
    if (!req.body.type || !req.body.amount || !req.body.dueDate) {
        return res.status(400).json({ message: 'Please add all required fields' });
    }

    const bill = await Bill.create({
        userId: req.user.id,
        type: req.body.type,
        amount: req.body.amount,
        dueDate: req.body.dueDate,
        status: req.body.status,
    });

    res.status(200).json(bill);
};

// @desc    Update bill
// @route   PUT /api/bills/:id
// @access  Private
const updateBill = async (req, res) => {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
        return res.status(400).json({ message: 'Bill not found' });
    }

    // Check for user
    if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
    }

    // Make sure the logged in user matches the bill user
    if (bill.userId.toString() !== req.user.id) {
        return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedBill = await Bill.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.status(200).json(updatedBill);
};

// @desc    Delete bill
// @route   DELETE /api/bills/:id
// @access  Private
const deleteBill = async (req, res) => {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
        return res.status(400).json({ message: 'Bill not found' });
    }

    // Check for user
    if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
    }

    // Make sure the logged in user matches the bill user
    if (bill.userId.toString() !== req.user.id) {
        return res.status(401).json({ message: 'User not authorized' });
    }

    await bill.deleteOne();

    res.status(200).json({ id: req.params.id });
};

module.exports = {
    getBills,
    setBill,
    updateBill,
    deleteBill,
};
