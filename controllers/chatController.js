const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

// @desc    Get chat messages
// @route   GET /api/chat/:userId
// @access  Private
const getMessages = async (req, res) => {
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

    // Limit to last 100 messages for performance, use lean() for speed
    const messages = await ChatMessage.find(query)
        .sort({ timestamp: -1 })
        .limit(100)
        .populate('senderId', 'name email')
        .lean();

    // Reverse to show oldest first
    messages.reverse();

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
            sender: isMe ? 'user' : 'others', // Simple mapping for frontend
            senderId: msg.senderId._id,
            name: senderName,
            avatar: initials,
            message: msg.message,
            attachment: msg.attachment,
            attachmentType: msg.attachmentType,
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: msg.timestamp // Add raw timestamp for frontend logic
        };
    });

    res.status(200).json(formattedMessages);
};

// @desc    Send chat message
// @route   POST /api/chat
// @access  Private
const sendMessage = async (req, res) => {
    console.log('sendMessage called');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);

    const { receiverId, message } = req.body;
    const file = req.file;

    if (!receiverId || (!message && !file)) {
        console.log('Validation failed: Missing receiverId or content');
        return res.status(400).json({ message: 'Please add receiverId and a message or file' });
    }

    let attachment = null;
    let attachmentType = null;

    if (file) {
        // Store relative path so frontend can construct URL
        // backend serves 'uploads' folder statically
        attachment = 'uploads/' + file.filename;

        console.log('Processed Attachment Path:', attachment);
        console.log('Detected Mimetype:', file.mimetype);
        const isImageMime = file.mimetype.startsWith('image');
        const isImageExt = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);

        attachmentType = (isImageMime || isImageExt) ? 'image' : 'file';
        console.log('Determined Attachment Type:', attachmentType);
    }

    const chatMessage = await ChatMessage.create({
        senderId: req.user.id,
        receiverId,
        message: message || '',
        attachment,
        attachmentType
    });

    const populatedMessage = await chatMessage.populate('senderId', 'name email');

    // Format response immediately so frontend can append it directly
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
                sender: 'others' // Broadcast as 'others' to receivers
            });
        }
    }

    res.status(200).json(formattedMessage);
};

const getInbox = async (req, res) => {
    try {
        const myId = req.user.id;

        // Use aggregation for much better performance
        const pipeline = [
            // Match messages involving current user (excluding community)
            {
                $match: {
                    $or: [
                        { senderId: new require('mongoose').Types.ObjectId(myId) },
                        { receiverId: myId }
                    ],
                    receiverId: { $ne: 'community' }
                }
            },
            // Sort by newest first
            { $sort: { timestamp: -1 } },
            // Group by conversation partner
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: [{ $toString: '$senderId' }, myId] },
                            '$receiverId',
                            { $toString: '$senderId' }
                        ]
                    },
                    lastMessage: { $first: '$message' },
                    attachment: { $first: '$attachment' },
                    timestamp: { $first: '$timestamp' }
                }
            },
            // Limit to 50 conversations
            { $limit: 50 }
        ];

        const conversations = await ChatMessage.aggregate(pipeline);

        // Batch load all users at once (instead of N individual queries)
        const userIds = conversations
            .map(c => c._id)
            .filter(id => id && id !== 'community' && /^[a-f\d]{24}$/i.test(id));

        const users = await User.find({ _id: { $in: userIds } })
            .select('name email')
            .lean();

        const userMap = new Map(users.map(u => [u._id.toString(), u]));

        const contacts = conversations
            .filter(c => userMap.has(c._id))
            .map(c => {
                const user = userMap.get(c._id);
                const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';
                return {
                    id: user._id,
                    name: user.name,
                    avatar: initials,
                    lastMessage: c.lastMessage || (c.attachment ? 'Attachment' : ''),
                    time: new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: c.timestamp,
                    online: false
                };
            });

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

        // Check ownership
        if (message.senderId.toString() !== userId) {
            return res.status(401).json({ message: 'Not authorized to delete this message' });
        }

        await message.deleteOne();

        // Emit socket event for real-time deletion if it's a community message
        if (req.io && message.receiverId === 'community') {
            req.io.to('community').emit('message_deleted', { id: messageId });
        }

        res.json({ message: 'Message deleted' });
    } catch (error) {
        console.error('Delete Message Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getMessages,
    sendMessage,
    getInbox,
    deleteMessage
};
