import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, FlatList, TouchableWithoutFeedback, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Send, Paperclip, X, MoreVertical, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { io, Socket } from 'socket.io-client';
import { api, BASE_URL } from '../services/api';
import ImageViewer from './ImageViewer';

export default function CommunityChat() {
    const navigation = useNavigation<any>();
    const [messages, setMessages] = useState<any[]>([]);
    const [messageText, setMessageText] = useState('');
    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const hasScrolledRef = useRef(false);
    const isInitialLoadRef = useRef(true);
    const socketRef = useRef<Socket | null>(null);
    const lastMsgTimestampRef = useRef<string | null>(null);

    useEffect(() => {
        loadUser();
        loadLastReadId();
        loadCachedMessages();
        loadUnreadCount();

        const socketUrl = BASE_URL.replace('/api', '');
        const socket = io(socketUrl, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join_community');
            displayChatWindow();
        });

        socket.on('new_message', (msg: any) => {
            setMessages((prev) => {
                if (prev.some((m) => m.id?.toString() === msg.id?.toString())) return prev;
                return [...prev, msg];
            });
        });

        socket.on('message_deleted', ({ id }: { id: string }) => {
            setMessages((prev) => prev.filter((m) => m.id?.toString() !== id?.toString()));
        });

        const interval = setInterval(() => displayChatWindow(true), 30000);

        return () => {
            clearInterval(interval);
            socket.disconnect();
            markAsRead();
        };
    }, []);

    useEffect(() => {
        if (messages.length > 0 && isInitialLoadRef.current && !hasScrolledRef.current) {
            setTimeout(() => {
                scrollToCorrectPosition();
                hasScrolledRef.current = true;
                isInitialLoadRef.current = false;
            }, 120);
        }
    }, [messages.length, lastReadMessageId, unreadCount]);

    const scrollToCorrectPosition = () => {
        if (!flatListRef.current || messages.length === 0) return;

        let targetIndex = messages.length - 1;
        if (lastReadMessageId && unreadCount > 0) {
            const lastReadIndex = messages.findIndex((m) => m.id?.toString() === lastReadMessageId);
            if (lastReadIndex > -1 && lastReadIndex < messages.length - 1) {
                targetIndex = lastReadIndex + 1;
            }
        }

        try {
            flatListRef.current.scrollToIndex({
                index: targetIndex,
                animated: false,
                viewPosition: 0,
            });
        } catch (error) {
            flatListRef.current.scrollToEnd({ animated: false });
        }
    };

    const loadUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
    };

    const loadCachedMessages = async () => {
        try {
            const cachedData = await AsyncStorage.getItem('cachedCommunityMessages');
            if (!cachedData) return;
            const parsedData = JSON.parse(cachedData);
            if (parsedData && parsedData.length > 0) setMessages(parsedData);
        } catch (error) {
            console.log('Failed to load cached messages');
        }
    };

    const loadLastReadId = async () => {
        try {
            const lastId = await AsyncStorage.getItem('lastReadCommunityMessageId');
            setLastReadMessageId(lastId);
        } catch (error) {
            console.log('Failed to load last read ID');
        }
    };

    const markAsRead = async () => {
        try {
            await api.chat.markAsRead('community');
            setUnreadCount(0);

            if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                if (lastMsg.id) {
                    await AsyncStorage.setItem('lastReadCommunityMessageId', lastMsg.id.toString());
                    setLastReadMessageId(lastMsg.id.toString());
                }
            }
        } catch (error) {
            console.log('Failed to mark as read:', error);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const counts = await api.chat.requestChatCenter();
            setUnreadCount(counts.community || 0);
        } catch (error) {
            console.log('Failed to load unread count');
        }
    };

    const displayChatWindow = async (incremental = false) => {
        try {
            let data: any[];
            if (incremental && lastMsgTimestampRef.current) {
                data = await api.chat.displayChatWindow(`community?since=${encodeURIComponent(lastMsgTimestampRef.current)}`);
                if (data.length > 0) {
                    setMessages((prev) => {
                        const existingIds = new Set(prev.map((m: any) => m.id?.toString()));
                        const newMsgs = data.filter((m: any) => !existingIds.has(m.id?.toString()));
                        return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
                    });
                }
            } else {
                data = await api.chat.displayChatWindow('community');
                setMessages(data);
                await AsyncStorage.setItem('cachedCommunityMessages', JSON.stringify(data));
            }

            if (data.length > 0) {
                const last = data[data.length - 1];
                lastMsgTimestampRef.current = last.rawTimestamp || new Date().toISOString();
            }
        } catch (error) {
            console.log('Failed to load messages');
        }
    };

    const handleDeleteMessage = async () => {
        if (!selectedMessage) return;
        try {
            await api.chat.deleteMessage(selectedMessage.id);
            setSelectedMessage(null);
            Alert.alert('Success', 'Message deleted');
            await displayChatWindow();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete message');
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.85,
        });
        if (!result.canceled) setSelectedImage(result.assets[0]);
    };

    const handleSend = async () => {
        const msgText = messageText.trim();
        const imgToSend = selectedImage;
        if (!msgText && !imgToSend) return;

        const tempId = `temp-${Date.now()}`;
        const userName = user?.name || 'You';
        const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

        const optimisticMessage = {
            id: tempId,
            sender: 'user',
            senderId: user?._id,
            name: userName,
            avatar: userInitials,
            message: msgText,
            attachment: imgToSend?.uri,
            attachmentType: imgToSend ? 'image' : null,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isPending: true,
            isFailed: false
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setMessageText('');
        setSelectedImage(null);

        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);

        try {
            const formData = new FormData();
            formData.append('receiverId', 'community');

            if (msgText) {
                // @ts-ignore
                formData.append('message', msgText);
            }
            if (imgToSend) {
                // @ts-ignore
                formData.append('file', {
                    uri: imgToSend.uri,
                    type: 'image/jpeg',
                    name: 'upload.jpg',
                });
            }

            const serverResponse = await api.chat.sendMessage(formData);
            setMessages((prev) => prev.map((msg) =>
                msg.id === tempId ? { ...serverResponse, isPending: false, isFailed: false } : msg
            ));
        } catch (error: any) {
            setMessages((prev) => prev.map((msg) =>
                msg.id === tempId ? { ...msg, isPending: false, isFailed: true } : msg
            ));
            Alert.alert('Send Failed', 'Tap message to retry');
        }
    };

    const handleRetryMessage = async (failedMsg: any) => {
        setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
        setMessageText(failedMsg.message || '');
        if (failedMsg.attachment && failedMsg.attachmentType === 'image') {
            setSelectedImage({ uri: failedMsg.attachment });
        }
    };

    const handleReportMessage = (msg: any) => {
        setSelectedMessage(null);
        Alert.alert(
            'Report Message',
            'Why are you reporting this message?',
            [
                { text: 'Inappropriate', onPress: () => submitReport(msg, 'inappropriate') },
                { text: 'Spam', onPress: () => submitReport(msg, 'spam') },
                { text: 'Harassment', onPress: () => submitReport(msg, 'harassment') },
                { text: 'Other', onPress: () => submitReport(msg, 'other') },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const submitReport = async (msg: any, reason: string) => {
        try {
            await api.chat.reportMessage(msg.id || msg._id, reason);
            Alert.alert('Reported', 'This message has been reported. Our team will review it.');
        } catch (error: any) {
            const errMsg = error?.message || 'Failed to report message';
            Alert.alert('Error', errMsg);
        }
    };

    const startPrivateChat = async (otherUser: any) => {
        try {
            const response = await api.chat.getChatStatus(otherUser.senderId);
            if (response.status === 'accepted') {
                setSelectedUser(null);
                navigation.navigate('PrivateChatDetail', {
                    chat: {
                        id: otherUser.senderId,
                        name: otherUser.name,
                        avatar: otherUser.avatar,
                    }
                });
            } else if (response.status === 'pending_sent') {
                Alert.alert('Pending', 'You have already sent a chat request to this user.');
            } else if (response.status === 'pending_received') {
                Alert.alert('Request Received', 'This user has sent you a chat request. Go to Private Chats to accept it.');
                setSelectedUser(null);
            } else {
                Alert.alert(
                    'Start Private Chat',
                    `You need to send a request to chat privately with ${otherUser.name}.`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Send Request',
                            onPress: async () => {
                                try {
                                    await api.chat.sendRequest(otherUser.senderId);
                                    Alert.alert('Success', 'Chat request sent!');
                                    setSelectedUser(null);
                                } catch (e: any) {
                                    Alert.alert('Error', e.message || 'Failed to send request');
                                }
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to server');
        }
    };

    const renderItem = ({ item: msg }: { item: any }) => {
        const isMine = msg.sender === 'user';
        const isSystem = msg.sender === 'admin';
        const imageUri = msg.isPending ? msg.attachment : api.getImageUrl(msg.attachment);

        if (isSystem) {
            return (
                <View className="items-center px-6 mb-4">
                    <View className="bg-gray-100 rounded-2xl px-4 py-2.5 max-w-[80%]">
                        <Text className="text-gray-700 text-sm text-center">{msg.message}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View className={`px-5 mb-5 ${msg.isPending ? 'opacity-60' : ''} ${msg.isFailed ? 'opacity-40' : ''}`}>
                <View className={`flex-row ${isMine ? 'justify-end' : 'justify-start'} items-end gap-3`}>
                    {!isMine && (
                        <TouchableOpacity
                            onPress={() => setSelectedUser(msg)}
                            className="w-9 h-9 rounded-full bg-[#ECEFF3] items-center justify-center mt-1"
                        >
                            <Text className="text-gray-600 text-xs font-medium">{msg.avatar}</Text>
                        </TouchableOpacity>
                    )}

                    <View className={`${isMine ? 'items-end' : 'items-start'} max-w-[74%]`}>
                        {!isMine && !!msg.name && (
                            <Text className="text-gray-500 text-[11px] mb-1 ml-1">{msg.name}</Text>
                        )}

                        {msg.attachment && msg.attachmentType === 'image' && (
                            <TouchableOpacity
                                onPress={() => setViewerImage(imageUri)}
                                activeOpacity={0.92}
                                style={{ marginBottom: msg.message ? 10 : 0 }}
                            >
                                <Image
                                    source={{ uri: imageUri }}
                                    style={{
                                        width: 240,
                                        height: 168,
                                        borderRadius: 20,
                                        backgroundColor: '#f2f2f2',
                                    }}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        )}

                        {msg.message ? (
                            <TouchableOpacity
                                onPress={() => msg.isFailed ? handleRetryMessage(msg) : setSelectedMessage(msg)}
                                onLongPress={() => !isMine ? handleReportMessage(msg) : undefined}
                                delayLongPress={500}
                            activeOpacity={0.88}
                                className={`px-4 py-3 ${isMine
                                    ? msg.isFailed ? 'bg-red-500 rounded-[18px] rounded-tr-[8px]' : 'bg-[#028554] rounded-[18px] rounded-tr-[8px]'
                                    : 'bg-[#F3F5F7] rounded-[18px] rounded-tl-[8px]'
                                    }`}
                            >
                                <Text className={`${isMine ? 'text-white' : 'text-gray-900'} text-[15px] leading-5`}>
                                    {msg.message}
                                </Text>
                                {msg.isFailed && (
                                    <Text className="text-white text-xs mt-1">Tap to retry</Text>
                                )}
                            </TouchableOpacity>
                        ) : null}

                        <Text className="text-gray-400 text-[11px] mt-1.5 px-1">{msg.time}</Text>
                    </View>

                    {isMine && (
                        <View className={`w-9 h-9 rounded-full ${msg.isFailed ? 'bg-red-500' : 'bg-[#028554]'} items-center justify-center mt-1`}>
                            <Text className="text-white text-xs font-medium">{msg.avatar}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const filteredMessages = messages.filter((msg) => {
        if (!searchQuery.trim()) return true;
        const lowerQuery = searchQuery.toLowerCase();
        return (
            (msg.message && msg.message.toLowerCase().includes(lowerQuery)) ||
            (msg.name && msg.name.toLowerCase().includes(lowerQuery))
        );
    });

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={0}
            >
                <View className="flex-1 bg-white">
                    <LinearGradient
                        colors={['#005A3D', '#006A45', '#027A4C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="px-5 pt-4 pb-4"
                    >
                        <View className="flex-row items-center gap-4">
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <ArrowLeft size={24} color="white" strokeWidth={1.7} />
                            </TouchableOpacity>

                            <View className="flex-1">
                                {!isSearchOpen ? (
                                    <View>
                                        <Text className="text-white text-[18px] font-semibold">UrbanEase Community</Text>
                                        <Text className="text-white/80 text-[13px] mt-0.5">{messages.length} messages</Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center bg-white/16 rounded-xl px-3 py-2">
                                        <Search size={16} color="rgba(255,255,255,0.78)" />
                                        <TextInput
                                            autoFocus
                                            className="flex-1 ml-2 text-white text-base"
                                            placeholder="Search..."
                                            placeholderTextColor="rgba(255,255,255,0.65)"
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                        />
                                        <TouchableOpacity onPress={() => { setSearchQuery(''); setIsSearchOpen(false); }}>
                                            <X size={16} color="rgba(255,255,255,0.78)" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {!isSearchOpen && (
                                <TouchableOpacity onPress={() => setIsSearchOpen(true)} className="w-10 h-10 items-center justify-center">
                                    <Search size={23} color="white" strokeWidth={1.7} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </LinearGradient>

                    {unreadCount > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                if (lastReadMessageId && flatListRef.current) {
                                    const unreadIndex = messages.findIndex((m) => m.id?.toString() === lastReadMessageId);
                                    if (unreadIndex > -1 && unreadIndex < messages.length - 1) {
                                        flatListRef.current.scrollToIndex({
                                            index: unreadIndex + 1,
                                            animated: true,
                                            viewPosition: 0
                                        });
                                    }
                                }
                            }}
                            className="bg-[#3B82F6] py-2.5 px-4"
                        >
                            <Text className="text-white text-center text-[13px] font-medium">
                                {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <FlatList
                        ref={flatListRef}
                        data={filteredMessages}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingTop: 18, paddingBottom: 28 }}
                        className="flex-1 bg-white"
                        onScrollToIndexFailed={(info) => {
                            const wait = new Promise((resolve) => setTimeout(resolve, 300));
                            wait.then(() => {
                                if (flatListRef.current && info.index < filteredMessages.length) {
                                    flatListRef.current.scrollToIndex({
                                        index: info.index,
                                        animated: false
                                    });
                                }
                            });
                        }}
                        onContentSizeChange={() => {
                            if (!isInitialLoadRef.current && messages.length > 0) {
                                flatListRef.current?.scrollToEnd({ animated: true });
                            }
                        }}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center py-24">
                                <ActivityIndicator size="large" color="#027A4C" />
                                <Text className="text-gray-400 mt-4">Loading messages...</Text>
                            </View>
                        }
                    />

                    <View className="bg-white border-t border-gray-100 px-4 py-3">
                        {selectedImage && (
                            <View className="flex-row items-center mb-3 bg-gray-50 p-2.5 rounded-2xl">
                                <Image source={{ uri: selectedImage.uri }} style={{ width: 42, height: 42, borderRadius: 8 }} />
                                <TouchableOpacity onPress={() => setSelectedImage(null)} className="ml-auto p-2">
                                    <Text className="text-gray-500 font-bold">X</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View className="flex-row items-center gap-3">
                            <TouchableOpacity onPress={pickImage} className="w-10 h-10 items-center justify-center">
                                <Paperclip size={23} color="#8B95A1" strokeWidth={1.6} />
                            </TouchableOpacity>
                            <TextInput
                                value={messageText}
                                onChangeText={setMessageText}
                                placeholder="Type a message..."
                                className="flex-1 px-5 py-3.5 bg-[#F5F6FA] rounded-full text-[16px]"
                                style={{ maxHeight: 100 }}
                                multiline
                            />
                            <TouchableOpacity onPress={handleSend} activeOpacity={0.85}>
                                <LinearGradient
                                    colors={['#006A45', '#027A4C']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    className="w-12 h-12 rounded-[16px] items-center justify-center"
                                >
                                    <Send size={19} color="white" strokeWidth={1.6} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <Modal visible={!!selectedUser} transparent animationType="fade" onRequestClose={() => setSelectedUser(null)}>
                <TouchableWithoutFeedback onPress={() => setSelectedUser(null)}>
                    <View className="flex-1 bg-black/50 items-center justify-center p-6">
                        <TouchableWithoutFeedback>
                            <View className="w-full bg-white rounded-2xl p-6 gap-4">
                                <View className="items-center pb-4 border-b border-gray-100">
                                    <View className="w-16 h-16 rounded-full bg-[#027A4C] items-center justify-center mb-3">
                                        <Text className="text-white text-2xl font-bold">{selectedUser?.avatar}</Text>
                                    </View>
                                    <Text className="text-gray-900 text-lg font-semibold">{selectedUser?.name}</Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => {
                                        navigation.navigate('UserProfile', { userId: selectedUser?.senderId });
                                        setSelectedUser(null);
                                    }}
                                    className="flex-row items-center gap-3 p-3 rounded-xl bg-gray-50"
                                >
                                    <MoreVertical size={20} color="#027A4C" />
                                    <Text className="flex-1 text-gray-900 text-base">View Profile</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => startPrivateChat(selectedUser)}
                                    className="flex-row items-center gap-3 p-3 rounded-xl bg-gray-50"
                                >
                                    <Send size={20} color="#027A4C" />
                                    <Text className="flex-1 text-gray-900 text-base">Private Chat</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => setSelectedUser(null)} className="p-3 rounded-xl bg-gray-100 items-center">
                                    <Text className="text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal visible={!!selectedMessage} transparent animationType="fade" onRequestClose={() => setSelectedMessage(null)}>
                <TouchableWithoutFeedback onPress={() => setSelectedMessage(null)}>
                    <View className="flex-1 bg-black/50 items-center justify-center p-6">
                        <TouchableWithoutFeedback>
                            <View className="w-full bg-white rounded-2xl p-6 gap-4">
                                <Text className="text-gray-900 text-lg font-semibold mb-2">Message Options</Text>
                                <Text className="text-gray-600 text-sm mb-4">{selectedMessage?.message}</Text>

                                {selectedMessage?.sender === 'user' && (
                                    <TouchableOpacity onPress={handleDeleteMessage} className="flex-row items-center gap-3 p-3 rounded-xl bg-red-50">
                                        <X size={18} color="#EF4444" strokeWidth={1.5} />
                                        <Text className="flex-1 text-red-600 text-sm font-medium">Delete Message</Text>
                                    </TouchableOpacity>
                                )}

                                {selectedMessage?.sender !== 'user' && selectedMessage?.sender !== 'admin' && (
                                    <TouchableOpacity onPress={() => handleReportMessage(selectedMessage)} className="flex-row items-center gap-3 p-3 rounded-xl bg-orange-50">
                                        <Text className="text-orange-600 text-lg">!</Text>
                                        <Text className="flex-1 text-orange-600 text-sm font-medium">Report Message</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity onPress={() => setSelectedMessage(null)} className="p-3 rounded-xl bg-gray-100 items-center">
                                    <Text className="text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {viewerImage && (
                <ImageViewer image={viewerImage} onClose={() => setViewerImage(null)} />
            )}
        </SafeAreaView>
    );
}
