const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
dotenv.config();

const compression = require('compression');

// Initialize Express
const app = express();

// Performance: Disable x-powered-by header
app.disable('x-powered-by');

// Middleware
app.use(compression({ level: 6, threshold: 1024 })); // Compress responses > 1KB
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    optionsSuccessStatus: 200 // For legacy browser support
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Performance: Cache-Control headers for API responses
// Performance: Cache-Control headers for API responses
// app.use((req, res, next) => {
//     // Cache GET requests for 30 seconds (stale-while-revalidate for 60s)
//     if (req.method === 'GET') {
//         res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
//     }
//     next();
// });

// Serve static files (uploads) - serve from BOTH possible directories
const uploadsPath1 = path.join(__dirname, 'uploads');
const uploadsPath2 = path.join(__dirname, '..', 'uploads');
console.log('📂 Static uploads path 1:', uploadsPath1);
console.log('📂 Static uploads path 2:', uploadsPath2);
app.use('/uploads', express.static(uploadsPath1, {
    maxAge: '7d',
    etag: true,
    lastModified: true
}));
app.use('/uploads', express.static(uploadsPath2, {
    maxAge: '7d',
    etag: true,
    lastModified: true
}));

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/urbanease', {
            autoIndex: true, // Build indexes
            maxPoolSize: 10 // Maintain up to 10 socket connections
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/carpool', require('./routes/carpoolRoutes'));

// Default Route
app.get('/', (req, res) => {
    res.send('UrbanEase API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// Initialize Socket.IO
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins for mobile/admin access
        methods: ["GET", "POST"]
    }
});

// Attach io to request for controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join_community', () => {
        socket.join('community');
        console.log(`Client ${socket.id} joined community`);
    });

    socket.on('join_private', (userId) => {
        socket.join(userId);
        console.log(`Client ${socket.id} joined private room: ${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
