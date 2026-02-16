const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get chat messages
// @route   GET /api/chat/:userId
// @access  Private
const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.user.id;

        let query;
        if (userId === 'community') {
            query = { receiverId: 'community' };
        } else {
            query = {
                $or: [
                    { senderId: myId, receiverId: userId },
                    { senderId: userId, receiverId: myId },
                ],
            };
        }

        // Get messages sorted by timestamp (oldest first)
        const messages = await ChatMessage.find(query)
            .sort({ timestamp: 1 })
            .limit(200)
            .populate('senderId', 'name email');

        const formattedMessages = messages.map(msg => {
            // Handle orphaned messages (sender deleted)
            if (!msg.senderId) {
                return {
                    id: msg._id,
                    sender: 'unknown',
                    senderId: null,
                    name: 'Unknown User',
                    avatar: '??',
                    message: msg.message,
                    attachment: msg.attachment,
                    attachmentType: msg.attachmentType,
                    time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: msg.timestamp
                };
            }

            const isMe = msg.senderId._id.toString() === myId;
            const senderName = msg.senderId.name;
            const initials = senderName ? senderName.split(' ').map(n => n[0]).join('').toUpperCase() : '??';

            return {
                id: msg._id,
                sender: isMe ? 'user' : 'others',
                senderId: msg.senderId._id,
                name: senderName,
                avatar: initials,
                message: msg.message,
                attachment: msg.attachment,
                attachmentType: msg.attachmentType,
                time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: msg.timestamp
            };
        });

        res.status(200).json(formattedMessages);
    } catch (error) {
        console.error('Get Messages Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Send chat message
// @route   POST /api/chat
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { receiverId, message } = req.body;
        const file = req.file;

        if (!receiverId || (!message && !file)) {
            return res.status(400).json({ message: 'Please add receiverId and a message or file' });
        }

        let attachment = null;
        let attachmentType = null;

        if (file) {
            attachment = 'uploads/' + file.filename;
            const isImageMime = file.mimetype.startsWith('image');
            const isImageExt = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);
            attachmentType = (isImageMime || isImageExt) ? 'image' : 'file';
        }

        if (receiverId !== 'community') {
            const ChatRequest = require('../models/ChatRequest');
            // Check if accepted request exists
            const request = await ChatRequest.findOne({
                $or: [
                    { senderId: req.user.id, receiverId, status: 'accepted' },
                    { senderId: receiverId, receiverId: req.user.id, status: 'accepted' }
                ]
            });

            if (!request) {
                return res.status(403).json({ message: 'Chat request required before messaging' });
            }
        }

        const chatMessage = await ChatMessage.create({
            senderId: req.user.id,
            receiverId,
            message: message || '',
            attachment,
            attachmentType
        });

        const populatedMessage = await chatMessage.populate('senderId', 'name email');

        const senderName = populatedMessage.senderId.name;
        const initials = senderName ? senderName.split(' ').map(n => n[0]).join('').toUpperCase() : '??';

        const formattedMessage = {
            id: populatedMessage._id,
            sender: 'user',
            senderId: populatedMessage.senderId._id,
            name: senderName,
            avatar: initials,
            message: populatedMessage.message,
            attachment: populatedMessage.attachment,
            attachmentType: populatedMessage.attachmentType,
            time: new Date(populatedMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Emit socket event
        if (req.io) {
            if (receiverId === 'community') {
                req.io.to('community').emit('new_message', {
                    ...formattedMessage,
                    sender: 'others'
                });
            }
        }

        res.status(200).json(formattedMessage);
    } catch (error) {
        console.error('Send Message Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get inbox (private chat contacts)
// @route   GET /api/chat/inbox
// @access  Private
const getInbox = async (req, res) => {
    try {
        const myId = req.user.id;

        // Find all private messages (excluding community)
        const messages = await ChatMessage.find({
            $and: [
                { $or: [{ senderId: myId }, { receiverId: myId }] },
                { receiverId: { $ne: 'community' } }
            ]
        })
            .sort({ timestamp: -1 })
            .limit(500);

        const contactMap = new Map();

        for (const msg of messages) {
            let otherId = msg.senderId.toString() === myId ? msg.receiverId : msg.senderId.toString();

            if (otherId === 'community') continue;

            if (!contactMap.has(otherId)) {
                contactMap.set(otherId, {
                    lastMessage: msg.message || (msg.attachment ? 'Attachment' : ''),
                    timestamp: msg.timestamp,
                    otherId
                });
            }
        }

        // Batch load users
        const userIds = Array.from(contactMap.keys()).filter(id => /^[a-f\d]{24}$/i.test(id));
        const users = await User.find({ _id: { $in: userIds } }).select('name email');
        const userMap = new Map(users.map(u => [u._id.toString(), u]));

        const contacts = [];
        for (const [id, data] of contactMap) {
            const user = userMap.get(id);
            if (user) {
                const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';
                contacts.push({
                    id: user._id,
                    name: user.name,
                    avatar: initials,
                    lastMessage: data.lastMessage,
                    time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: data.timestamp,
                    online: false
                });
            }
        }

        res.status(200).json(contacts);
    } catch (error) {
        console.error('Inbox Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete chat message
// @route   DELETE /api/chat/:id
// @access  Private
const deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.id;

        const message = await ChatMessage.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (message.senderId.toString() !== userId) {
            return res.status(401).json({ message: 'Not authorized to delete this message' });
        }

        await message.deleteOne();

        if (req.io && message.receiverId === 'community') {
            req.io.to('community').emit('message_deleted', { id: messageId });
        }

        res.json({ message: 'Message deleted' });
    } catch (error) {
        console.error('Delete Message Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get reported messages
// @route   GET /api/chat/reports
// @access  Private (Admin)
const getReportedMessages = async (req, res) => {
    try {
        const MessageReport = require('../models/MessageReport');

        // Find all reports that are not dismissed
        const reports = await MessageReport.find({ status: { $ne: 'dismissed' } });

        // Get unique message IDs
        const messageIds = [...new Set(reports.map(r => r.messageId.toString()))];

        if (messageIds.length === 0) {
            return res.json([]);
        }

        // Fetch the actual messages
        const messages = await ChatMessage.find({ _id: { $in: messageIds } })
            .populate('senderId', 'name email')
            .sort({ timestamp: -1 });

        const formattedMessages = messages.map(msg => {
            if (!msg.senderId) return null; // Skip if sender deleted

            const senderName = msg.senderId.name;
            const initials = senderName ? senderName.split(' ').map(n => n[0]).join('').toUpperCase() : '??';

            return {
                id: msg._id,
                sender: 'others',
                senderId: msg.senderId._id,
                name: senderName,
                avatar: initials,
                message: msg.message,
                attachment: msg.attachment,
                attachmentType: msg.attachmentType,
                time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: msg.timestamp,
                flagged: true // Mark as flagged
            };
        }).filter(Boolean);

        res.status(200).json(formattedMessages);
    } catch (error) {
        console.error('Get Reported Messages Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get unread counts
// @route   GET /api/chat/unread
// @access  Private
const requestChatCenter = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Count unread community messages
        const communityUnreadCount = await ChatMessage.countDocuments({
            receiverId: 'community',
            timestamp: { $gt: user.lastCommunityRead || new Date(0) }
        });

        // For private chats, we'd need a lastRead map. Stubbing to 0 for now to fix crash.
        // TODO: Implement per-chat read status

        res.status(200).json({
            community: communityUnreadCount,
            private: 0 // Placeholder
        });
    } catch (error) {
        console.error('Request Chat Center Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark chat as read
// @route   POST /api/chat/read/:chatId
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        if (chatId === 'community') {
            await User.findByIdAndUpdate(userId, {
                lastCommunityRead: new Date()
            });
        }

        // For private chats, add logic here when schema supports it

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Mark As Read Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Send chat request
// @route   POST /api/chat/request
// @access  Private
const sendRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user.id;
        const ChatRequest = require('../models/ChatRequest');

        if (!receiverId) {
            return res.status(400).json({ message: 'Receiver ID required' });
        }

        // Check if request already exists
        const existing = await ChatRequest.findOne({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        });

        if (existing) {
            if (existing.status === 'accepted') {
                return res.status(400).json({ message: 'Chat already accepted', status: 'accepted' });
            }
            if (existing.status === 'pending') {
                return res.status(400).json({ message: 'Request already pending', status: 'pending' });
            }
            // If rejected, maybe allow re-sending? For now, block.
            if (existing.status === 'rejected') {
                // Optional: Allow resending after some time?
                // For now, let's allow resending by updating status to pending
                existing.status = 'pending';
                existing.senderId = senderId; // Reset sender to current user
                existing.receiverId = receiverId;
                await existing.save();
                return res.status(200).json({ message: 'Request sent again', request: existing });
            }
        }

        const newRequest = await ChatRequest.create({
            senderId,
            receiverId,
            status: 'pending'
        });

        res.status(201).json({ message: 'Request sent', request: newRequest });
    } catch (error) {
        console.error('Send Request Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get pending requests
// @route   GET /api/chat/requests
// @access  Private
const getRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const ChatRequest = require('../models/ChatRequest');

        // Find requests where I am the receiver AND status is pending
        const requests = await ChatRequest.find({
            receiverId: userId,
            status: 'pending'
        }).populate('senderId', 'name email');

        // Format for UI
        const formatted = requests.map(r => ({
            id: r._id,
            sender: {
                id: r.senderId._id,
                name: r.senderId.name,
                avatar: r.senderId.name ? r.senderId.name.charAt(0).toUpperCase() : '?'
            },
            status: r.status,
            createdAt: r.createdAt
        }));

        res.status(200).json(formatted);
    } catch (error) {
        console.error('Get Requests Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Respond to request
// @route   PUT /api/chat/request/:requestId
// @access  Private
const respondToRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'
        const userId = req.user.id;
        const ChatRequest = require('../models/ChatRequest');

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const request = await ChatRequest.findOne({
            _id: requestId,
            receiverId: userId // Ensure I am the receiver
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = status;
        await request.save();

        res.status(200).json({ message: `Request ${status}`, request });
    } catch (error) {
        console.error('Respond Request Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get chat status with a user
// @route   GET /api/chat/status/:userId
// @access  Private
const getChatStatus = async (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const myId = req.user.id;
        const ChatRequest = require('../models/ChatRequest');

        const request = await ChatRequest.findOne({
            $or: [
                { senderId: myId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: myId }
            ]
        });

        if (!request) {
            return res.json({ status: 'none' });
        }

        if (request.status === 'accepted') {
            return res.json({ status: 'accepted', requestId: request._id });
        }

        if (request.status === 'pending') {
            const isSentByMe = request.senderId.toString() === myId;
            return res.json({
                status: isSentByMe ? 'pending_sent' : 'pending_received',
                requestId: request._id
            });
        }

        if (request.status === 'rejected') {
            // Treat rejected as none? Or specific status?
            // If I sent it and it was rejected -> 'none' (allow retry) or 'rejected'
            return res.json({ status: 'rejected' });
        }

        res.json({ status: 'none' });

    } catch (error) {
        console.error('Get Status Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    displayChatWindow: getMessages,
    deliverMessage: sendMessage,
    getInbox,
    deleteMessage,
    getReportedMessages,
    requestChatCenter,
    markAsRead,
    sendRequest,
    getRequests,
    respondToRequest,
    getChatStatus
};
