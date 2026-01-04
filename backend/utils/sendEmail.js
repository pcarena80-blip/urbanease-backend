const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // secure: true for 465, false for other ports
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // khan.iqbal6361@gmail.com
            pass: process.env.EMAIL_PASSWORD // App Password
        }
    });

    const message = {
        from: `UrbanEase Support <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.message
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = sendEmail;
