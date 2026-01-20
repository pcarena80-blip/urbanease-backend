const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Constants
const ENV_SANDBOX = 'sandbox';
const ENV_PRODUCTION = 'production';

const BASE_URL_SANDBOX = 'https://testpaymentapi.hbl.com/';
const BASE_URL_PRODUCTION = 'https://digitalbankingportal.hbl.com/';

class HBLService {
    constructor() {
        this.env = process.env.HBL_ENV || ENV_SANDBOX;
        this.baseUrl = this.env === ENV_SANDBOX ? BASE_URL_SANDBOX : BASE_URL_PRODUCTION;

        // Credentials
        this.userId = process.env.HBL_USER_ID;
        this.password = process.env.HBL_PASSWORD;
        this.channel = process.env.HBL_CHANNEL || 'HBLPay';
        this.returnUrl = process.env.HBL_RETURN_URL || 'http://localhost:5000/api/payment/return';
        this.cancelUrl = process.env.HBL_CANCEL_URL || 'http://localhost:5000/api/payment/cancel';

        // Load Keys
        try {
            const keysDir = path.join(__dirname, '..', 'keys');
            this.publicKey = fs.readFileSync(path.join(keysDir, 'hbl-public.pem'), 'utf8');
            this.privateKey = fs.readFileSync(path.join(keysDir, 'private.pem'), 'utf8');
        } catch (error) {
            console.warn('HBL Keys not found in backend/keys/. Payment service will fail if keys are missing.');
            this.publicKey = null;
            this.privateKey = null;
        }
    }

    /**
     * Encrypt data using RSA Public Key
     * PHP equivalent: openssl_public_encrypt($data, $cdata, $key_resource)
     */
    encrypt(data) {
        if (!this.publicKey) throw new Error('HBL Public Key missing');

        try {
            const buffer = Buffer.from(String(data));
            const encrypted = crypto.publicEncrypt(
                {
                    key: this.publicKey,
                    padding: crypto.constants.RSA_PKCS1_PADDING,
                },
                buffer
            );
            return encrypted.toString('base64');
        } catch (error) {
            console.error('Encryption error:', error);
            throw error;
        }
    }

    /**
     * Decrypt data using RSA Private Key
     * PHP equivalent: openssl_private_decrypt(base64_decode($data), $decrypted_data, $key_resource)
     */
    decrypt(data) {
        if (!this.privateKey) throw new Error('Private Key missing');

        try {
            // PHP SDK handles "+" replacement, we might need it too if data comes from URL
            const cleanData = data.replace(/ /g, '+');
            const buffer = Buffer.from(cleanData, 'base64');

            const decrypted = crypto.privateDecrypt(
                {
                    key: this.privateKey,
                    padding: crypto.constants.RSA_PKCS1_PADDING,
                },
                buffer
            );
            return decrypted.toString('utf8');
        } catch (error) {
            console.error('Decryption error:', error);
            throw error;
        }
    }

    /**
     * Recursive payload encryption
     * Mimics PHP: encryptPayload(&$payload)
     */
    encryptPayload(payload) {
        const encryptedPayload = {}; // Create new object to avoid mutating original if needed

        for (const key in payload) {
            const val = payload[key];

            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                // Recursive call for objects
                encryptedPayload[key] = this.encryptPayload(val);
            } else if (Array.isArray(val)) {
                // Recursive call for arrays
                encryptedPayload[key] = val.map(item => this.encryptPayload(item));
            } else {
                // Base case: encrypt value if not null and not USER_ID
                if (val !== null && key !== 'USER_ID') {
                    encryptedPayload[key] = this.encrypt(val);
                } else {
                    encryptedPayload[key] = val;
                }
            }
        }
        return encryptedPayload;
    }

    /**
     * Get Session ID from HBL
     */
    async getSessionId(checkoutReq) {
        // MOCK MODE: If credentials are standard placeholders or missing, return a fake session
        if (!this.userId || this.userId === 'your_user_id' || this.env === 'mock') {
            console.log('⚠️ Running in HBL MOCK MODE. Returning fake session ID.');
            return `MOCK_SESSION_${Date.now()}`;
        }

        const uriToken = this.env === ENV_SANDBOX ? 'HBLPay' : 'HostedCheckout';
        const url = `${this.baseUrl}${uriToken}/api/checkout`;

        // Inject Config Fields
        const fullRequest = {
            ...checkoutReq,
            USER_ID: this.userId,
            PASSWORD: this.password,
            RETURN_URL: this.returnUrl,
            CANCEL_URL: this.cancelUrl,
            CHANNEL: this.channel,
        };

        // Encrypt
        const postFields = this.encryptPayload(fullRequest);

        try {
            const response = await axios.post(url, postFields, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data && response.data.Data && response.data.Data.SESSION_ID) {
                return response.data.Data.SESSION_ID;
            } else {
                throw new Error(`HBL API Error: ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            // Handle Axios error structure
            const msg = error.response ? JSON.stringify(error.response.data) : error.message;
            throw new Error(`HBL Request Failed: ${msg}`);
        }
    }

    /**
     * Get Redirect URL
     */
    getRedirectUrl(sessionId) {
        // MOCK MODE URL
        if (sessionId.startsWith('MOCK_SESSION')) {
            return `http://localhost:5000/api/payment/mock-page?session_id=${sessionId}`;
        }

        const uriToken = this.env === ENV_SANDBOX ? 'HBLPay' : 'HostedCheckout';
        const encodedSessionId = Buffer.from(sessionId).toString('base64');
        return `${this.baseUrl}${uriToken}/Site/index.html#/checkout?data=${encodedSessionId}`;
    }
}

module.exports = new HBLService();
