const crypto = require('crypto');
const axios = require('axios');

// Sandbox configuration - switch to live by changing these
const SANDBOX_BASE_URL = process.env.PAYMENT_SANDBOX_URL || 'https://sandbox.payfast.pk/api';
const MERCHANT_ID = process.env.PAYMENT_MERCHANT_ID || 'sandbox_merchant';
const SECRET_KEY = process.env.PAYMENT_SECRET_KEY || 'sandbox_secret_key_12345';
const API_KEY = process.env.PAYMENT_API_KEY || 'sandbox_api_key';

/**
 * Generate HMAC SHA256 signature for payment data
 * @param {Object} data - Payment data object
 * @returns {string} HMAC signature
 */
const generateSignature = (data) => {
    // Sort keys alphabetically and create query string
    const sortedKeys = Object.keys(data).sort();
    const string = sortedKeys
        .map(key => `${key}=${data[key]}`)
        .join('&');

    return crypto
        .createHmac('sha256', SECRET_KEY)
        .update(string)
        .digest('hex');
};

/**
 * Verify signature from payment aggregator
 * @param {Object} receivedData - Data received from aggregator
 * @param {string} receivedSignature - Signature received from aggregator
 * @returns {boolean} True if signature is valid
 */
const verifySignature = (receivedData, receivedSignature) => {
    const generated = generateSignature(receivedData);
    return generated === receivedSignature;
};

/**
 * Create payment session with aggregator
 * @param {Object} params - Payment parameters
 * @param {string} params.orderId - Unique order ID
 * @param {number} params.amount - Amount in PKR
 * @param {string} params.billRef - Bill reference
 * @param {string} params.customerEmail - Customer email (optional)
 * @param {string} params.customerPhone - Customer phone (optional)
 * @returns {Promise<Object>} Payment response from aggregator
 */
const createPayment = async ({ orderId, amount, billRef, customerEmail, customerPhone }) => {
    try {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

        const data = {
            merchant_id: MERCHANT_ID,
            order_id: orderId,
            amount: amount.toFixed(2),
            currency: 'PKR',
            description: `Bill Payment - ${billRef}`,
            return_url: `${backendUrl}/api/payment/return`,
            callback_url: `${backendUrl}/api/payment/webhook`,
            cancel_url: `${backendUrl}/api/payment/cancel`
        };

        // Add optional customer data
        if (customerEmail) data.customer_email = customerEmail;
        if (customerPhone) data.customer_phone = customerPhone;

        // Generate signature
        data.signature = generateSignature(data);

        console.log('Creating payment with aggregator:', { orderId, amount });

        // In sandbox mode, we simulate the response
        // In production, this would be actual API call to PayFast/Safepay
        const response = await axios.post(`${SANDBOX_BASE_URL}/create`, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Payment creation error:', error.message);
        throw new Error(`Payment aggregator error: ${error.message}`);
    }
};

/**
 * Check payment status from aggregator
 * @param {string} orderId - Order ID to check
 * @returns {Promise<Object>} Payment status
 */
const checkPaymentStatus = async (orderId) => {
    try {
        const response = await axios.get(`${SANDBOX_BASE_URL}/status/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Payment status check error:', error.message);
        throw new Error(`Status check failed: ${error.message}`);
    }
};

/**
 * Simulate sandbox payment (for testing only)
 * @param {string} orderId - Order ID
 * @param {string} status - Desired status (success/failed)
 * @returns {Object} Simulated response
 */
const simulateSandboxPayment = (orderId, status = 'success') => {
    const data = {
        order_id: orderId,
        status: status,
        transaction_id: `TXN${Date.now()}`,
        amount: '0.00',
        currency: 'PKR',
        timestamp: new Date().toISOString()
    };

    return {
        ...data,
        signature: generateSignature(data)
    };
};

module.exports = {
    generateSignature,
    verifySignature,
    createPayment,
    checkPaymentStatus,
    simulateSandboxPayment
};
