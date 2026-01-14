const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const test = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne(); // Get ANY user
        if (!user) {
            console.log('No user found');
            process.exit(1);
        }

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        console.log('Got User:', user.email);

        // Hit AWS
        console.log('Posting to AWS...');
        const res = await axios.post('http://51.20.34.254:5000/api/carpool', {
            contactNumber: '+923001234567',
            vehicleType: 'Car',
            vehicleName: 'Test Civic',
            vehicleNumber: 'ABC-999',
            seatingCapacity: 4,
            seatsAvailable: 3,
            pickupLocation: 'Urban E Society',
            destination: 'Test Dest',
            tripType: 'one-way',
            schedule: [{ day: 'Monday', goingTime: '09:00', goingPeriod: 'AM' }]
        }, { headers: { Authorization: `Bearer ${token}` } });

        console.log('✅ AWS CARPOOL CREATED:', res.status, res.data);

    } catch (e) {
        if (e.response) {
            console.log('❌ AWS ERROR:', e.response.status, JSON.stringify(e.response.data, null, 2));
        } else {
            console.log('❌ AWS NETWORK ERROR:', e.message);
        }
    }
    process.exit();
}
test();
