const Notice = require('../models/Notice');

// @desc    Get all notices
// @route   GET /api/notices
const getNotices = async (req, res) => {
    try {
        // Only return notices that haven't expired
        const notices = await Notice.find({
            expiryDate: { $gte: new Date() }
        }).sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a notice (Admin only)
// @route   POST /api/notices
const createNotice = async (req, res) => {
    const { title, description, expiryDate } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'Please add all required fields' });
    }

    try {
        const notice = await Notice.create({
            title,
            description,
            expiryDate
        });
        res.status(201).json(notice);
    } catch (error) {
        console.error('Error creating notice:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a notice (Admin only)
// @route   DELETE /api/notices/:id
const deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);

        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        await notice.deleteOne();
        res.json({ message: 'Notice removed' });
    } catch (error) {
        console.error('Error deleting notice:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getNotices,
    createNotice,
    deleteNotice
};
