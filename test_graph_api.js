const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const testGraphApi = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('Admin user not found');
            process.exit(1);
        }

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        console.log('Generated Token:', token);

        try {
            const response = await axios.get('http://localhost:5000/api/admin/stats/graphs', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('API Response Status:', response.status);
            console.log('API Data:', JSON.stringify(response.data, null, 2));
        } catch (apiError) {
            if (apiError.response) {
                console.error('API Error:', apiError.response.status, apiError.response.data);
            } else {
                console.error('API Error:', apiError.message);
            }
        }

        process.exit();
    } catch (error) {
        console.error('Script Error:', error);
        process.exit(1);
    }
};

testGraphApi();
