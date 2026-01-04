require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
    console.log('--- Email Configuration Diagnosis ---');
    console.log(`EMAIL_USER Present: ${!!process.env.EMAIL_USER}`);
    console.log(`EMAIL_PASSWORD Present: ${!!process.env.EMAIL_PASSWORD}`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('ERROR: EMAIL_USER or EMAIL_PASSWORD is missing in .env file.');
        return;
    }

    console.log(`Attempting to send email from: ${process.env.EMAIL_USER}...`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const message = {
        from: `UrbanEase Test <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Send to self
        subject: 'UrbanEase SMTP Diagnosis',
        text: 'If you receive this, the email configuration is CORRECT.'
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('SUCCESS: Email sent!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('FAILURE: Could not send email.');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        if (error.response) {
            console.error('SMTP Response:', error.response);
        }
    }
};

testEmail();
