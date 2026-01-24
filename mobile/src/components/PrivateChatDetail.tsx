import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Paperclip, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageViewer from './ImageViewer';
import * as ImagePicker from 'expo-image-picker';

export default function PrivateChatDetail() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { chat } = route.params || {};
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);
    useEffect(() => {
        loadUser();
        initializeChat();

        let socketSubscription: any;

        const setupSocket = async () => {
            try {
                // Ensure connection
                await socketService.connect();

                // Listen for new messages
                socketService.on('new_private_message', (newMsg: any) => {
                    console.log('[PrivateChat] Real-time message received:', newMsg);

                    // Verify correct chat
                    if (newMsg.senderId === chat.id) {
                        setMessages(prev => {
                            // Deduplicate just in case
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                        // Mark as read
                        api.chat.markAsRead(chat.id);
                    }
                });
            } catch (e) {
                console.error('Socket setup failed:', e);
            }
        };

        setupSocket();

        // Polling fallback (every 30s for performance)
        const interval = setInterval(loadMessages, 30000);

        return () => {
            clearInterval(interval);
            socketService.off('new_private_message');
        };
    }, []);

    const initializeChat = async () => {
        if (!chat?.id) {
            console.error('[PrivateChat] ERROR: No chat.id provided!', chat);
            setIsLoading(false);
            return;
        }

        console.log('[PrivateChat] Initializing chat with ID:', chat.id);
        setIsLoading(true);

        // Timeout promise to prevent infinite loading
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), 10000)
        );

        try {
            const [msgs, counts] = await Promise.race([
                Promise.all([
                    api.chat.getMessages(chat.id),
                    api.chat.getUnreadCounts()
                ]),
                timeout
            ]);

            const messagesArray = Array.isArray(msgs) ? msgs : [];
            setMessages(messagesArray);

            let count = 0;
            if (counts?.privateChats && counts.privateChats[chat.id]) {
                count = counts.privateChats[chat.id];
            }
            setUnreadCount(count);

            // Mark as read immediately
            await api.chat.markAsRead(chat.id);
        } catch (e) {
            console.error('[PrivateChat] Init failed or timed out:', e);
            Alert.alert('Notice', 'Could not load latest messages. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
    };

    const loadMessages = async () => {
        if (!chat?.id) return;

        try {
            const data = await api.chat.getMessages(chat.id);
            const messagesArray = Array.isArray(data) ? data : [];

            // Only update if changes to avoid re-renders
            setMessages(prev => {
                const prevIds = new Set(prev.map(m => m.id));
                const hasChanges = messagesArray.some(m => !prevIds.has(m.id)) || messagesArray.length !== prev.length;
                if (hasChanges) {
                    return messagesArray;
                }
                return prev;
            });

        } catch (error) {
            console.error('[PrivateChat] loadMessages ERROR:', error);
        }
    };

    const loadUnreadCount = async () => {
        try {
            // We can get the specific count for this chat by getting all counts
            const counts = await api.chat.getUnreadCounts();
            if (counts.privateChats && counts.privateChats[chat.id]) {
                setUnreadCount(counts.privateChats[chat.id]);
            } else {
                setUnreadCount(0);
            }
        } catch (error) {
            console.log('Failed to load unread count');
        }
    };

    const markAsRead = async () => {
        try {
            await api.chat.markAsRead(chat.id);
            setUnreadCount(0);
        } catch (error) {
            console.log('Failed to mark as read');
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.7,
            });

            if (!result.canceled) {
                setSelectedImage(result.assets[0]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    if (!chat) return null;

    const handleSend = async () => {
        if (!messageText.trim() && !selectedImage) return;

        // Optimistic update - add message immediately
        const optimisticId = `temp-${Date.now()}`;
        const tempMessage = {
            id: optimisticId,
            senderId: user?._id,
            sender: 'user',
            message: messageText.trim(),
            timestamp: new Date().toISOString(),
            attachment: selectedImage?.uri,
            attachmentType: selectedImage ? 'image' : null
        };

        setMessages(prev => [...prev, tempMessage]);
        setMessageText('');
        const savedImage = selectedImage;
        setSelectedImage(null);

        try {
            if (savedImage) {
                const formData = new FormData();
                formData.append('receiverId', chat.id);
                if (tempMessage.message) {
                    formData.append('message', tempMessage.message);
                }

                // Append file with robust filename/type
                const filename = savedImage.uri.split('/').pop() || 'upload.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                // @ts-ignore
                formData.append('file', {
                    uri: Platform.OS === 'ios' ? savedImage.uri.replace('file://', '') : savedImage.uri,
                    name: filename,
                    type: type,
                });

                await api.chat.sendMessage(formData);
            } else {
                await api.chat.sendMessage({
                    receiverId: chat.id,
                    message: tempMessage.message
                });
            }

            // Correctly remove the temp message when real one loads, or just reload all
            // Ideally we replace the temp message with the real one, but reloading is safer for sync
            await loadMessages();
        } catch (error) {
            console.error('Send failed:', error);
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
            Alert.alert('Error', 'Failed to send message');
        }
    };

    const renderItem = ({ item: msg }: { item: any }) => {
        if (!msg) return null;

        const isMe = msg.senderId === user?._id || msg.sender === 'user';
        const hasMessage = msg.message && msg.message.trim().length > 0;
        const hasImage = msg.attachment && msg.attachmentType === 'image';

        return (
            <View className={`flex-row mb-4 ${isMe ? 'justify-end' : 'justify-start'} px-6`}>
                <View className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Image Message */}
                    {hasImage && (
                        <TouchableOpacity
                            onPress={() => setViewerImage(api.getImageUrl(msg.attachment))}
                            activeOpacity={0.9}
                            style={{ marginBottom: hasMessage ? 8 : 0 }}
                        >
                            <Image
                                source={{ uri: api.getImageUrl(msg.attachment) }}
                                style={{
                                    width: 200,
                                    height: 150,
                                    borderRadius: 12,
                                    backgroundColor: '#f0f0f0',
                                    borderWidth: 1,
                                    borderColor: '#e0e0e0'
                                }}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    )}

                    {/* Text Message */}
                    {hasMessage && (
                        <View
                            className={`p-3.5 ${isMe
                                ? 'bg-[#F1F8F4] rounded-2xl rounded-tr-sm'
                                : 'bg-white rounded-2xl rounded-tl-sm'
                                }`}
                        >
                            <Text className={`${isMe ? 'text-[#027A4C]' : 'text-gray-900'} text-sm`}>
                                {msg.message}
                            </Text>
                        </View>
                    )}

                    {/* Timestamp */}
                    <Text className="text-gray-400 mt-1 text-[11px]">
                        {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        )
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={0}
            >
                <View className="flex-1">
                    {/* Header */}
                    <LinearGradient
                        colors={['#003E2F', '#027A4C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="px-6 pt-4 pb-4 border-b border-gray-100"
                    >
                        <View className="flex-row items-center gap-4">
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <ArrowLeft size={24} color="white" strokeWidth={1.5} />
                            </TouchableOpacity>
                            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                                <Text className="text-white text-sm font-semibold">
                                    {chat.avatar}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-white text-lg font-semibold">
                                    {chat.name}
                                </Text>
                                <Text className="text-white/80 text-xs">
                                    {chat.online ? 'Online' : 'Offline'}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Unread Messages Banner */}
                    {unreadCount > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                // Scroll logic would go here if we tracked specific message IDs
                                // For now just mark as read
                                markAsRead();
                            }}
                            className="bg-blue-500 py-2 px-4"
                        >
                            <Text className="text-white text-center font-medium">
                                ↓ {unreadCount} unread message{unreadCount > 1 ? 's' : ''} from {chat.name}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Messages */}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item, index) => item?.id?.toString() || `msg-${index}`}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 24, flexGrow: 1 }}
                        className="flex-1 bg-gray-50"
                        initialScrollIndex={messages.length > 0 ? messages.length - 1 : undefined}
                        getItemLayout={(data, index) => ({ length: 80, offset: 80 * index, index })}
                        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center py-20">
                                {isLoading ? (
                                    <>
                                        <ActivityIndicator size="large" color="#027A4C" />
                                        <Text className="text-gray-400 mt-4">Loading messages...</Text>
                                    </>
                                ) : (
                                    <Text className="text-gray-400 text-center">No messages yet.{'\n'}Start the conversation!</Text>
                                )}
                            </View>
                        }
                    />

                    {/* Image Preview */}
                    {selectedImage && (
                        <View className="px-4 py-2 bg-gray-100 border-t border-gray-200">
                            <View className="relative w-20 h-20">
                                <Image
                                    source={{ uri: selectedImage.uri }}
                                    className="w-20 h-20 rounded-lg"
                                />
                                <TouchableOpacity
                                    onPress={() => setSelectedImage(null)}
                                    className="absolute -top-2 -right-2 bg-gray-200 rounded-full p-1"
                                >
                                    <X size={16} color="black" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Input Bar - Now properly positioned with KeyboardAvoidingView */}
                    <View className="bg-white border-t border-gray-100 px-4 py-3">
                        <View className="flex-row items-center gap-3">
                            <TouchableOpacity
                                onPress={pickImage}
                                className="text-gray-400"
                            >
                                <Paperclip size={20} color="#9CA3AF" strokeWidth={1.5} />
                            </TouchableOpacity>
                            <TextInput
                                value={messageText}
                                onChangeText={setMessageText}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-base"
                                style={{ maxHeight: 100 }}
                                multiline
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#003E2F', '#027A4C']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="w-11 h-11 rounded-xl items-center justify-center"
                                >
                                    <Send size={20} color="white" strokeWidth={1.5} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Image Viewer */}
            {viewerImage && (
                <ImageViewer
                    image={viewerImage}
                    onClose={() => setViewerImage(null)}
                />
            )}
        </SafeAreaView>
    );
}




