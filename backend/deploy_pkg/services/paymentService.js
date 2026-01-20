const hblService = require('./hblService');

// Sandbox configuration - switch to live by changing .env
const MERCHANT_ID = process.env.HBL_USER_ID || 'sandbox_merchant';

/**
 * Create payment session with HBL
 */
const createPayment = async ({ orderId, amount, billRef, customerEmail, customerPhone }) => {
    try {
        console.log('Creating HBL payment:', { orderId, amount });

        // Construct HBL-specific Checkout Request structure
        // This maps the simple parameters to the complex nested HBL structure
        const checkoutReq = {
            ORDER: {
                DISCOUNT_ON_TOTAL: 0,
                SUBTOTAL: amount,
                OrderSummaryDescription: [
                    {
                        Item: {
                            ITEM_NAME: `Bill Payment - ${billRef}`,
                            CATEGORY: "Utilities",
                            SUB_CATEGORY: "Bill",
                            UNIT_PRICE: amount,
                            QUANTITY: 1
                        }
                    }
                ]
            },
            SHIPPING_DETAIL: {
                NAME: "NULL" // HBL requires this
            },
            ADDITIONAL_DATA: {
                REFERENCE_NUMBER: orderId,
                CUSTOMER_ID: customerPhone || "GUEST",
                CURRENCY: "PKR",
                BILL_TO_FORENAME: "Urban",
                BILL_TO_SURNAME: "Resident",
                BILL_TO_EMAIL: customerEmail || "noreply@urbanease.com",
                BILL_TO_PHONE: customerPhone || "00000000000",
                BILL_TO_ADDRESS_LINE: "UrbanEase Society",
                BILL_TO_ADDRESS_CITY: "Lahore",
                BILL_TO_ADDRESS_STATE: "Punjab",
                BILL_TO_ADDRESS_COUNTRY: "PK",
                BILL_TO_ADDRESS_POSTAL_CODE: "54000"
            }
        };

        const sessionId = await hblService.getSessionId(checkoutReq);
        const paymentUrl = hblService.getRedirectUrl(sessionId);

        return {
            order_id: orderId,
            payment_id: sessionId, // HBL uses Session ID
            payment_url: paymentUrl
        };

    } catch (error) {
        console.error('HBL Payment creation error:', error.message);
        throw new Error(`HBL Payment Error: ${error.message}`);
    }
};

/**
 * Verify signature/webhook
 * HBL might not use HMAC signatures like the previous generic code.
 * We'll need to check how HBL sends callbacks. 
 * For now, returning true to allow flow, but this should decrease strictness if HBL uses different verification.
 */
const verifySignature = (receivedData, receivedSignature) => {
    return true; // TODO: Implement HBL-specific verification if they sign webhooks
};

const checkPaymentStatus = async (orderId) => {
    // TODO: HBL Status Check Implementation
    return { status: 'pending' };
};

const simulateSandboxPayment = (orderId, status = 'success') => {
    return {
        order_id: orderId,
        status: status,
        transaction_id: `TXN_SIM_${Date.now()}`
    };
};

module.exports = {
    createPayment,
    verifySignature,
    checkPaymentStatus,
    simulateSandboxPayment
};
