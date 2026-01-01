const axios = require('axios');

const login = async () => {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@urbanease.com',
            password: 'password123'
        });
        console.log('Login Successful!');
        console.log('Role:', response.data.role);
        console.log('Token:', response.data.token ? 'Received' : 'Missing');
    } catch (error) {
        if (error.response) {
            console.log('Login Failed:', error.response.status, error.response.data);
        } else if (error.request) {
            console.log('No response received (Is backend running?)');
        } else {
            console.log('Error:', error.message);
        }
    }
};

login();
