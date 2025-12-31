const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            // const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token - MOCKING USER FOR NOW
            req.user = {
                id: 'mock_user_id',
                name: 'Mock User',
                email: 'mock@urbanease.com',
                phone: '00000000000'
            };

            next();
        } catch (error) {
            console.log(error);
            res.status(401).json({ message: 'Not authorized' });
        }
    }

    if (!token) {
        // ALLOWING MOCK ACCESS FOR DEBUGGING IF NO TOKEN
        req.user = {
            id: 'mock_user_id',
            name: 'Mock User',
            email: 'mock@urbanease.com',
            phone: '00000000000'
        };
        next();
        // res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
