const JobAlert = require('../models/JobAlert');

// Create a new job alert
exports.createJobAlert = async (req, res) => {
    try {
        const {
            title,
            company,
            location,
            description,
            salary,
            employmentType,
            contactEmail,
            contactPhone,
            isActive
        } = req.body;

        const newAlert = new JobAlert({
            userId: req.user._id,
            title,
            company,
            location,
            description,
            salary,
            employmentType,
            contactEmail,
            contactPhone,
            isActive
        });

        await newAlert.save();
        res.status(201).json({ success: true, message: 'Job alert created successfully', data: newAlert });
    } catch (error) {
        console.error('Error creating job alert:', error);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get all active job alerts (with optional search/filtering)
exports.getAllJobAlerts = async (req, res) => {
    try {
        const filters = { isActive: true };
        
        if (req.query.title) {
            filters.title = { $regex: req.query.title, $options: 'i' };
        }
        if (req.query.location) {
            filters.location = { $regex: req.query.location, $options: 'i' };
        }
        if (req.query.company) {
            filters.company = { $regex: req.query.company, $options: 'i' };
        }
        if (req.query.employmentType) {
            filters.employmentType = req.query.employmentType;
        }

        const alerts = await JobAlert.find(filters)
            .populate('userId', 'name email profileImage')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: alerts });
    } catch (error) {
        console.error('Error fetching job alerts:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get current user's job alerts
exports.getMyJobAlerts = async (req, res) => {
    try {
        const alerts = await JobAlert.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, data: alerts });
    } catch (error) {
        console.error('Error fetching user job alerts:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get a single job alert by ID
exports.getJobAlertById = async (req, res) => {
    try {
        const alert = await JobAlert.findById(req.params.id)
            .populate('userId', 'name email profileImage');
            
        if (!alert) {
            return res.status(404).json({ success: false, message: 'Job alert not found' });
        }
        
        res.status(200).json({ success: true, data: alert });
    } catch (error) {
        console.error('Error fetching job alert BY ID:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'Invalid Job Alert ID' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Update an existing job alert
exports.updateJobAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await JobAlert.findById(id);

        if (!alert) {
            return res.status(404).json({ success: false, message: 'Job alert not found' });
        }

        // Verify the user owns this job alert
        if (alert.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this alert' });
        }

        const updatedAlert = await JobAlert.findByIdAndUpdate(
            id, 
            { $set: req.body }, 
            { new: true, runValidators: true }
        );
        
        res.status(200).json({ success: true, message: 'Job alert updated successfully', data: updatedAlert });
    } catch (error) {
        console.error('Error updating job alert:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Delete a job alert
exports.deleteJobAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await JobAlert.findById(id);

        if (!alert) {
            return res.status(404).json({ success: false, message: 'Job alert not found' });
        }

        // Only the owner or an admin can delete
        if (alert.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this alert' });
        }

        await alert.deleteOne();
        res.status(200).json({ success: true, message: 'Job alert deleted successfully' });
    } catch (error) {
        console.error('Error deleting job alert:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
