const superAdminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a Super Admin' });
    }
};

module.exports = superAdminMiddleware;
