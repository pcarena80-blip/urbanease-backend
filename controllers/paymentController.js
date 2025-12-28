const Transaction = require('../models/Transaction');
const PaymentLog = require('../models/PaymentLog');
const { createPayment, verifySignature, checkPaymentStatus, simulateSandboxPayment } = require('../services/paymentService');

/**
 * Create a new payment transaction
 * POST /api/payment/create
 */
exports.createPaymentTransaction = async (req, res) => {
    try {
        const { billId, amount } = req.body;
        const userId = req.user.id || req.user._id;

        // Validate input
        if (!billId || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid bill ID or amount' });
        }

        // Generate unique order ID
        const orderId = `URB${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Create transaction record
        const transaction = await Transaction.create({
            userId,
            billId,
            orderId,
            amount,
            status: 'pending'
        });

        // Log transaction creation
        await PaymentLog.create({
            transactionId: transaction._id,
            event: 'created',
            data: { orderId, amount, billId }
        });

        try {
            // Call payment aggregator
            const paymentData = await createPayment({
                orderId,
                amount,
                billRef: billId,
                customerEmail: req.user.email,
                customerPhone: req.user.phone
            });

            // Update transaction with aggregator response
            transaction.aggregatorOrderId = paymentData.order_id || paymentData.payment_id;
            transaction.aggregatorResponse = paymentData;
            await transaction.save();

            // Log payment initiation
            await PaymentLog.create({
                transactionId: transaction._id,
                event: 'initiated',
                data: paymentData
            });

            res.status(200).json({
                success: true,
                orderId,
                paymentUrl: paymentData.payment_url || paymentData.url,
                transactionId: transaction._id
            });

        } catch (paymentError) {
            // Log payment creation failure
            await PaymentLog.create({
                transactionId: transaction._id,
                event: 'failed',
                error: paymentError.message
            });

            transaction.status = 'failed';
            await transaction.save();

            throw paymentError;
        }

    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({ message: error.message || 'Failed to create payment' });
    }
};

/**
 * Handle payment webhook from aggregator
 * POST /api/payment/webhook
 */
exports.handleWebhook = async (req, res) => {
    try {
        const { order_id, status, signature, transaction_id, ...restData } = req.body;

        console.log('Webhook received:', { order_id, status });

        // Log webhook receipt
        await PaymentLog.create({
            event: 'webhook_received',
            data: req.body
        });

        // Verify signature
        const dataToVerify = { order_id, status, transaction_id, ...restData };
        if (!verifySignature(dataToVerify, signature)) {
            console.error('Invalid webhook signature');
            await PaymentLog.create({
                event: 'webhook_failed',
                error: 'Invalid signature',
                data: req.body
            });
            return res.status(400).json({ message: 'Invalid signature' });
        }

        // Find transaction
        const transaction = await Transaction.findOne({ orderId: order_id });
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Prevent duplicate updates (idempotency)
        if (transaction.status !== 'pending') {
            console.log('Transaction already processed:', order_id);
            return res.status(200).json({ message: 'Already processed' });
        }

        // Update transaction status
        transaction.status = status;
        transaction.callbackData = req.body;
        transaction.signature = signature;
        transaction.paymentMethod = restData.payment_method || 'unknown';
        await transaction.save();

        // Log successful webhook verification
        await PaymentLog.create({
            transactionId: transaction._id,
            event: 'webhook_verified',
            data: { order_id, status, transaction_id }
        });

        // Log status change
        await PaymentLog.create({
            transactionId: transaction._id,
            event: status,
            data: req.body
        });

        res.status(200).json({ success: true, message: 'Webhook processed' });

    } catch (error) {
        console.error('Webhook processing error:', error);
        await PaymentLog.create({
            event: 'webhook_failed',
            error: error.message,
            data: req.body
        });
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get payment status
 * GET /api/payment/status/:orderId
 */
exports.getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id || req.user._id;

        const transaction = await Transaction.findOne({ orderId, userId });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.status(200).json({
            success: true,
            transaction: {
                orderId: transaction.orderId,
                amount: transaction.amount,
                status: transaction.status,
                paymentMethod: transaction.paymentMethod,
                createdAt: transaction.createdAt,
                updatedAt: transaction.updatedAt
            }
        });

    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get user's payment history
 * GET /api/payment/history
 */
exports.getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { status, limit = 20 } = req.query;

        const query = { userId };
        if (status) query.status = status;

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('billId', 'type amount dueDate');

        res.status(200).json({
            success: true,
            transactions
        });

    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Handle payment return (user redirected from payment gateway)
 * GET /api/payment/return
 */
exports.handleReturn = async (req, res) => {
    const { order_id, status } = req.query;

    // In a real app, redirect to mobile deep link or show success page
    res.send(`
    <html>
      <head><title>Payment ${status}</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Payment ${status === 'success' ? 'Successful' : 'Failed'}</h1>
        <p>Order ID: ${order_id}</p>
        <p>Status: ${status}</p>
        <p>You can close this window and return to the app.</p>
        <script>
          // Attempt to close window after 3 seconds
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
    </html>
  `);
};

/**
 * Simulate sandbox payment (testing only)
 * POST /api/payment/simulate
 */
exports.simulatePayment = async (req, res) => {
    try {
        const { orderId, status = 'success' } = req.body;

        // Only allow in development/sandbox mode
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ message: 'Not available in production' });
        }

        const simulatedData = simulateSandboxPayment(orderId, status);

        // Call our own webhook
        const mockReq = { body: simulatedData };
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    return res.status(code).json(data);
                }
            })
        };

        await exports.handleWebhook(mockReq, mockRes);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Legacy function for backward compatibility
exports.initiatePayment = exports.createPaymentTransaction;

module.exports = exports;
