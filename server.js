const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Ensure JWT_SECRET is set for development if missing
if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET not found in .env, using default dev secret');
    process.env.JWT_SECRET = 'urbanease_default_dev_secret_999';
}

// Connect to database
connectDB();

const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for now, tighten for prod
        methods: ["GET", "POST"]
    }
});

// Make io accessible to our routers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));

// Default Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join_community', () => {
        socket.join('community');
        console.log(`Socket ${socket.id} joined community`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
