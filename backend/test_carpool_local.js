const axios = require('axios');

const testCarpool = async () => {
    try {
        console.log('1. Attempting Login...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@urbanease.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token obtained.');

        // 2. Create Carpool (One-Way)
        console.log('2. Creating One-Way Carpool...');
        const payloadOneWay = {
            contactNumber: '03001234567', // Frontend strips non-digits and ensures 10 chars. Form adds +92
            // Wait, frontend sends +92... so I should send +92 prefix?
            // "contactNumber: `+92${formData.contactNumber}`" line 191 in CarpoolForm
            // Value in state is just digits.
            contactNumber: '+923001234567',
            vehicleType: 'Car',
            vehicleName: 'Honda City',
            vehicleNumber: 'ABC-123',
            seatingCapacity: 4,
            seatsAvailable: 3,
            tripType: 'one-way',
            schedule: [
                {
                    day: 'Mon',
                    goingTime: '8:00',
                    goingPeriod: 'AM'
                }
            ],
            pickupLocation: 'Urban E Society',
            destination: 'Lahore Test'
        };

        const createRes = await axios.post('http://localhost:5000/api/carpool', payloadOneWay, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('One-Way Carpool creation successful:', createRes.data);

        // 3. Create Carpool (Two-Way)
        console.log('3. Creating Two-Way Carpool...');
        const payloadTwoWay = {
            contactNumber: '+923001234567',
            vehicleType: 'SUV',
            vehicleName: 'Prado',
            vehicleNumber: 'XYZ-786',
            seatingCapacity: 4,
            seatsAvailable: 2,
            tripType: 'two-way',
            schedule: [
                {
                    day: 'Tue',
                    goingTime: '9:00',
                    goingPeriod: 'AM',
                    returnTime: '5:00',
                    returnPeriod: 'PM'
                }
            ],
            pickupLocation: 'Urban E Society',
            destination: 'Islamabad'
        };

        const createRes2 = await axios.post('http://localhost:5000/api/carpool', payloadTwoWay, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Two-Way Carpool creation successful:', createRes2.data);

        // 4. Get All Carpools
        console.log('4. Fetching all carpools...');
        const getRes = await axios.get('http://localhost:5000/api/carpool', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Fetched Carpools:', JSON.stringify(getRes.data, null, 2));

    } catch (error) {
        if (error.response) {
            console.log('Request Failed:', error.response.status, error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
};

testCarpool();
