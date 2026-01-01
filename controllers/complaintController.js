const Complaint = require('../models/Complaint');

// @desc    Get complaints
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res) => {
    const complaints = await Complaint.find({ userId: req.user.id });
    res.status(200).json(complaints);
};

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Private
const createComplaint = async (req, res) => {
    if (!req.body.subject || !req.body.description) {
        return res.status(400).json({ message: 'Please add subject and description' });
    }

    const complaint = await Complaint.create({
        userId: req.user.id,
        category: req.body.category,
        subject: req.body.subject,
        description: req.body.description,
        priority: req.body.priority || 'low',
        image: req.file ? `/uploads/${req.file.filename}` : null
    });

    res.status(200).json(complaint);
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id
// @access  Private
const updateComplaint = async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        return res.status(400).json({ message: 'Complaint not found' });
    }

    // Check for user
    if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
    }

    // Make sure the logged in user matches the complaint user
    if (complaint.userId.toString() !== req.user.id) {
        return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.status(200).json(updatedComplaint);
};

module.exports = {
    getComplaints,
    createComplaint,
    updateComplaint,
};
