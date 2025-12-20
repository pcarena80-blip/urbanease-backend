const axios = require('axios');

// @desc    Initiate Payment (Mock for JazzCash/EasyPaisa)
// @route   POST /api/payment/initiate
// @access  Private
const initiatePayment = async (req, res) => {
    const { method, amount, mobileNumber, cnic, billId } = req.body;

    if (!method || !amount || !mobileNumber || !cnic) {
        return res.status(400).json({ message: 'Please provide all payment details' });
    }

    console.log(`Initiating ${method} payment for PKR ${amount}`);
    console.log(`Payer: ${mobileNumber}, CNIC: ${cnic}`);

    // CHECK FOR LIVE MODE
    const isLive = process.env.PAYMENT_MODE === 'LIVE';

    if (isLive) {
        if (method === 'JazzCash') {
            try {
                // JazzCash Integerity Salt and Merchant Credentials from .env
                const merchantId = process.env.JAZZCASH_MERCHANT_ID;
                const password = process.env.JAZZCASH_PASSWORD;
                const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT;

                // Construct JazzCash Payload (Simplified Example)
                const payload = {
                    "pp_Version": "1.1",
                    "pp_TxnType": "MWALLET",
                    "pp_Language": "EN",
                    "pp_MerchantID": merchantId,
                    "pp_Password": password,
                    "pp_BankID": "TBANK",
                    "pp_ProductID": "RETAIL",
                    "pp_TxnRefNo": "T" + Date.now(),
                    "pp_Amount": amount * 100, // Amount in Paisa
                    "pp_TxnCurrency": "PKR",
                    "pp_TxnDateTime": new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
                    "pp_BillReference": "billRef",
                    "pp_Description": "Utility Bill Payment",
                    "pp_MobileNumber": mobileNumber,
                    "pp_CNIC": cnic
                };

                // In a real implementation, you must generate a SecureHash using the Integrity Salt
                // payload.pp_SecureHash = calculateSecureHash(payload, integritySalt);

                /* 
                const jazzCashResponse = await axios.post('https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction', payload);
                if (jazzCashResponse.data.pp_ResponseCode === '000') {
                    // Success logic
                }
                */

                // For now, even in 'LIVE' mode setup, we return this message because we don't have the keys
                return res.status(200).json({
                    success: false,
                    message: "Live Payment Configured but Credentials Missing. Please check server logs."
                });

            } catch (error) {
                console.error("JazzCash API Error:", error);
                return res.status(500).json({ message: "Payment Gateway Error" });
            }
        }
    }

    // MOCK FAILURE (Simulating a real system, sometimes it fails)
    // const success = Math.random() > 0.1; 

    // MOCK DELAY
    await new Promise(resolve => setTimeout(resolve, 2000));

    // MOCK SUCCESS (Always True for Demo)
    const success = true;

    if (success) {
        // You might want to update the Bill status here if billId is provided
        /*
        if (billId) {
            await Bill.findByIdAndUpdate(billId, { status: 'paid', paidAt: Date.now() });
        }
        */

        return res.status(200).json({
            success: true,
            message: `[TEST MODE] Payment of PKR ${amount} via ${method} initiated successfully.`,
            transactionId: 'TXN-' + Date.now()
        });
    } else {
        return res.status(400).json({
            success: false,
            message: 'Payment failed'
        });
    }
};

module.exports = {
    initiatePayment
};
