const axios = require('axios');

const BASE_URL = 'http://51.20.34.254:5000/api';

const testOtpEmail = async () => {
    console.log('[OTP TEST] Testing OTP email delivery on AWS...\n');

    try {
        // Test with a real email address
        const testEmail = 'khan.iqbal6361@gmail.com';

        console.log(`[1] Sending OTP to: ${testEmail}`);
        const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
            email: testEmail
        });

        console.log('[1] Response:', response.data);

        if (response.data.message.includes('Email failed')) {
            console.log('\n⚠️ EMAIL DELIVERY FAILED!');
            console.log('The OTP was generated but email was NOT delivered.');
            console.log('Check server logs for error details.');
        } else {
            console.log('\n✅ OTP Sent Successfully!');
            console.log('Check your email inbox for the OTP.');
        }

    } catch (error) {
        console.error('################ TEST FAILED ################');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
};

testOtpEmail();
