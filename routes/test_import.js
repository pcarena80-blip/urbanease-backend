try {
    const auth = require('../middleware/authMiddleware');
    console.log('Successfully loaded authMiddleware');
    console.log(auth);
} catch (error) {
    console.error('Failed to load authMiddleware:', error);
}
