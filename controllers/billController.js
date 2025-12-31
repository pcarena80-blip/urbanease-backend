const mongoose = require('mongoose');

// Temporary Schema if model doesn't exist
// const Bill = require('../models/Bill');

// Mock Data for now since Model might be missing
const mockBills = [
    {
        _id: '1',
        type: 'Electricity',
        month: 'December 2025',
        amount: 5000,
        dueDate: '2025-12-10',
        status: 'due',
        refNo: 'ELEC-2025-12-001'
    },
    {
        _id: '2',
        type: 'Water',
        month: 'December 2025',
        amount: 1200,
        dueDate: '2025-12-15',
        status: 'paid',
        paidDate: '2025-12-05',
        refNo: 'WAT-2025-12-001',
        method: 'Online'
    },
    {
        _id: '3',
        type: 'Maintenance',
        month: 'January 2026',
        amount: 3000,
        dueDate: '2026-01-05',
        status: 'upcoming',
        refNo: 'MAIN-2026-01-001'
    }
];

// @desc    Get all bills
// @route   GET /api/bills
// @access  Private
exports.getAllBills = async (req, res) => {
    // In a real app, verify user from req.user
    // const bills = await Bill.find({ user: req.user.id });

    // For now, return mock bills
    res.status(200).json(mockBills);
};

// @desc    Get bill by ID
// @route   GET /api/bills/:id
// @access  Private
exports.getBillById = async (req, res) => {
    const bill = mockBills.find(b => b._id === req.params.id);
    if (bill) {
        res.status(200).json(bill);
    } else {
        res.status(404).json({ message: 'Bill not found' });
    }
};

// @desc    Update bill (e.g. pay)
// @route   PUT /api/bills/:id
// @access  Private
exports.updateBill = async (req, res) => {
    const bill = mockBills.find(b => b._id === req.params.id);
    if (bill) {
        // Mock update
        Object.assign(bill, req.body);
        res.status(200).json(bill);
    } else {
        res.status(404).json({ message: 'Bill not found' });
    }
};
