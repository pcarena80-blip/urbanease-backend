import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, FlatList, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Send, Paperclip, X, MoreVertical, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
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

    useEffect(() => {
        loadUser();
        loadLastReadId();
        loadCachedMessages();
        loadMessages();
        loadUnreadCount();
        // Reduced polling interval for better performance
        const interval = setInterval(loadMessages, 30000); // 30 seconds for performance
        return () => {
            clearInterval(interval);
            markAsRead(); // Mark as read when leaving
        };
    }, []);

    // Scroll to correct position on initial load only
    const scrollToCorrectPosition = () => {
        if (!flatListRef.current || messages.length === 0) return;

        // Find first unread message index
        let targetIndex = messages.length - 1; // Default: latest message

        if (lastReadMessageId && unreadCount > 0) {
            // Find the last read message and scroll to the one after it
            const lastReadIndex = messages.findIndex(m => m.id?.toString() === lastReadMessageId);
            if (lastReadIndex > -1 && lastReadIndex < messages.length - 1) {
                targetIndex = lastReadIndex + 1; // First unread
            }
        }

        // Use scrollToIndex for precise positioning
        try {
            flatListRef.current.scrollToIndex({
                index: targetIndex,
                animated: false, // No animation on initial load for instant positioning
                viewPosition: 0, // Show at top of viewport
            });
        } catch (e) {
            // Fallback to scrollToEnd
            flatListRef.current.scrollToEnd({ animated: false });
        }
    };

    // Initial scroll effect - runs only once when messages first load
    useEffect(() => {
        if (messages.length > 0 && isInitialLoadRef.current && !hasScrolledRef.current) {
            // Small delay to ensure FlatList has rendered
            setTimeout(() => {
                scrollToCorrectPosition();
                hasScrolledRef.current = true;
                isInitialLoadRef.current = false;
            }, 100);
        }
    }, [messages.length, lastReadMessageId, unreadCount]);

    const loadUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    };

    const loadCachedMessages = async () => {
        try {
            const cachedData = await AsyncStorage.getItem('cachedCommunityMessages');
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                if (parsedData && parsedData.length > 0) {
                    setMessages(parsedData);
                }
            }
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
            // Call backend API to mark community chat as read
            await api.chat.markAsRead('community');
            setUnreadCount(0);

            // Also update local storage for scroll position
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
            const counts = await api.chat.getUnreadCounts();
            setUnreadCount(counts.community || 0);
        } catch (error) {
            console.log('Failed to load unread count');
        }
    };

    const loadMessages = async () => {
        try {
            const data = await api.chat.getMessages('community');
            setMessages(data);
            await AsyncStorage.setItem('cachedCommunityMessages', JSON.stringify(data));
        } catch (error) {
            console.log('Failed to load messages');
        }
    };

    const handleDeleteMessage = async () => {
        if (!selectedMessage) return;

        try {
            console.log('🗑️ CommunityChat: Deleting message:', selectedMessage.id);
            await api.chat.deleteMessage(selectedMessage.id);
            setSelectedMessage(null);
            Alert.alert('Success', 'Message deleted');
            // Reload messages to show updated list
            await loadMessages();
        } catch (error: any) {
            console.error('🗑️ CommunityChat: Delete error:', error);
            Alert.alert('Error', error.message || 'Failed to delete message');
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0]);
        }
    };

    const handleSend = async () => {
        const msgText = messageText.trim();
        const imgToSend = selectedImage;

        if (!msgText && !imgToSend) return;

        // Generate temp ID for optimistic message
        const tempId = `temp-${Date.now()}`;
        const userName = user?.name || 'You';
        const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

        // Create optimistic message immediately
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

        // Add to UI immediately (optimistic update)
        setMessages(prev => [...prev, optimisticMessage]);
        setMessageText('');
        setSelectedImage(null);

        // Scroll to bottom immediately
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);

        try {
            const formData = new FormData();
            formData.append('receiverId', 'community');

            if (msgText) {
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

            // Replace temp message with real one from server
            setMessages(prev => prev.map(msg =>
                msg.id === tempId
                    ? { ...serverResponse, isPending: false, isFailed: false }
                    : msg
            ));

            // Update cache with new messages
            setMessages(prev => {
                AsyncStorage.setItem('cachedCommunityMessages', JSON.stringify(prev));
                return prev;
            });

        } catch (error: any) {
            console.log('Send failed:', error);
            // Mark message as failed, allow retry
            setMessages(prev => prev.map(msg =>
                msg.id === tempId
                    ? { ...msg, isPending: false, isFailed: true }
                    : msg
            ));
            Alert.alert('Send Failed', 'Tap message to retry');
        }
    };

    // Retry a failed message
    const handleRetryMessage = async (failedMsg: any) => {
        // Remove failed message
        setMessages(prev => prev.filter(m => m.id !== failedMsg.id));
        // Re-send
        setMessageText(failedMsg.message || '');
        if (failedMsg.attachment && failedMsg.attachmentType === 'image') {
            setSelectedImage({ uri: failedMsg.attachment });
        }
    };

    const startPrivateChat = (otherUser: any) => {
        setSelectedUser(null);
        navigation.navigate('PrivateChatDetail', {
            chat: {
                id: otherUser.senderId,
                name: otherUser.name,
                avatar: otherUser.avatar,
            }
        });
    };

    const renderItem = ({ item: msg }: { item: any }) => (
        <View className={`flex-row gap-3 mb-4 ${msg.sender === 'admin' ? 'justify-center' : ''} px-6 ${msg.isPending ? 'opacity-60' : ''} ${msg.isFailed ? 'opacity-40' : ''}`}>
            {msg.sender !== 'admin' && msg.sender !== 'user' && (
                <TouchableOpacity
                    onPress={() => setSelectedUser(msg)}
                    className="w-9 h-9 rounded-full bg-gray-200 items-center justify-center flex-shrink-0"
                >
                    <Text className="text-gray-600 text-xs font-medium">
                        {msg.avatar}
                    </Text>
                </TouchableOpacity>
            )}
            {msg.sender === 'user' && <View className="w-9" />}

            <View
                className={`flex-1 ${msg.sender === 'admin' ? 'max-w-[80%]' : 'max-w-[75%]'} ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
                {msg.sender !== 'admin' && msg.sender !== 'user' && (
                    <Text className="text-gray-600 mb-1 text-xs font-medium">
                        {msg.name}
                    </Text>
                )}

                {/* Image Message */}
                {msg.attachment && msg.attachmentType === 'image' && (
                    <TouchableOpacity
                        onPress={() => setViewerImage(msg.isPending ? msg.attachment : api.getImageUrl(msg.attachment))}
                        activeOpacity={0.9}
                        style={{ marginBottom: msg.message ? 8 : 0 }}
                    >
                        <Image
                            source={{ uri: msg.isPending ? msg.attachment : api.getImageUrl(msg.attachment) }}
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
                {msg.message ? (
                    <TouchableOpacity
                        onPress={() => msg.isFailed ? handleRetryMessage(msg) : setSelectedMessage(msg)}
                        activeOpacity={0.8}
                        className={`p-3.5 ${msg.sender === 'admin'
                            ? 'bg-gray-100 rounded-2xl'
                            : msg.sender === 'user'
                                ? msg.isFailed ? 'bg-red-500 rounded-2xl rounded-tr-sm' : 'bg-[#027A4C] rounded-2xl rounded-tr-sm'
                                : 'bg-[#F5F5F5] rounded-2xl rounded-tl-sm'
                            }`}
                    >
                        <Text className={`${msg.sender === 'admin' ? 'text-gray-700 text-center' : msg.sender === 'user' ? 'text-white' : 'text-gray-900'} text-sm`}>
                            {msg.message}
                        </Text>
                        {msg.isFailed && (
                            <Text className="text-white text-xs mt-1">⚠️ Tap to retry</Text>
                        )}
                    </TouchableOpacity>
                ) : null}
                <View className="flex-row items-center gap-1 mt-1">
                    <Text className={`text-gray-400 text-[11px] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                        {msg.time}
                    </Text>
                    {msg.isPending && <Text className="text-gray-400 text-[10px]">⏳</Text>}
                    {msg.isFailed && <Text className="text-red-500 text-[10px]">❌</Text>}
                </View>
            </View>

            {msg.sender === 'user' && (
                <View className={`w-9 h-9 rounded-full ${msg.isFailed ? 'bg-red-500' : 'bg-[#027A4C]'} items-center justify-center flex-shrink-0`}>
                    <Text className="text-white text-xs font-medium">
                        {msg.avatar}
                    </Text>
                </View>
            )}
        </View>
    );

    const filteredMessages = messages.filter(msg => {
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

                            <View className="flex-1">
                                {!isSearchOpen ? (
                                    <View>
                                        <Text className="text-white text-lg font-semibold">
                                            UrbanEase Community
                                        </Text>
                                        <Text className="text-white/80 text-xs">
                                            {messages.length} messages
                                        </Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center bg-white/20 rounded-lg px-3 py-1">
                                        <Search size={16} color="rgba(255,255,255,0.7)" />
                                        <TextInput
                                            autoFocus
                                            className="flex-1 ml-2 text-white text-base"
                                            placeholder="Search..."
                                            placeholderTextColor="rgba(255,255,255,0.6)"
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                        />
                                        <TouchableOpacity onPress={() => { setSearchQuery(''); setIsSearchOpen(false); }}>
                                            <X size={16} color="rgba(255,255,255,0.7)" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {!isSearchOpen && (
                                <TouchableOpacity onPress={() => setIsSearchOpen(true)}>
                                    <Search size={24} color="white" strokeWidth={1.5} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </LinearGradient>

                    {/* Unread Messages Banner */}
                    {unreadCount > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                // Scroll to first unread and mark as read
                                if (lastReadMessageId && flatListRef.current) {
                                    const unreadIndex = messages.findIndex(m => m.id?.toString() === lastReadMessageId);
                                    if (unreadIndex > -1 && unreadIndex < messages.length - 1) {
                                        flatListRef.current.scrollToIndex({
                                            index: unreadIndex + 1,
                                            animated: true,
                                            viewPosition: 0
                                        });
                                    }
                                }
                            }}
                            className="bg-blue-500 py-2 px-4"
                        >
                            <Text className="text-white text-center font-medium">
                                ↓ {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Messages */}
                    <FlatList
                        ref={flatListRef}
                        data={filteredMessages}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 24 }}
                        className="flex-1 bg-white"
                        onScrollToIndexFailed={(info) => {
                            // Retry with delay to allow layout
                            const wait = new Promise(resolve => setTimeout(resolve, 300));
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
                            // Scroll to end when new messages arrive (after initial load)
                            if (!isInitialLoadRef.current && messages.length > 0) {
                                flatListRef.current?.scrollToEnd({ animated: true });
                            }
                        }}
                        initialNumToRender={20}
                        maxToRenderPerBatch={10}
                    />

                    {/* Input Bar - Now properly positioned with KeyboardAvoidingView */}
                    <View className="bg-white border-t border-gray-100 px-4 py-3">
                        {selectedImage && (
                            <View className="flex-row items-center mb-2 bg-gray-50 p-2 rounded-lg">
                                <Image source={{ uri: selectedImage.uri }} style={{ width: 40, height: 40, borderRadius: 4 }} />
                                <TouchableOpacity onPress={() => setSelectedImage(null)} className="ml-auto p-2">
                                    <Text className="text-gray-500 font-bold">X</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <View className="flex-row items-center gap-3">
                            <TouchableOpacity onPress={pickImage} className="text-gray-400">
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

            {/* Profile Options Modal */}
            <Modal
                visible={!!selectedUser}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedUser(null)}
            >
                <TouchableWithoutFeedback onPress={() => setSelectedUser(null)}>
                    <View className="flex-1 bg-black/50 items-center justify-center p-6">
                        <TouchableWithoutFeedback>
                            <View className="w-full bg-white rounded-2xl p-6 gap-4">
                                <View className="items-center pb-4 border-b border-gray-100">
                                    <View className="w-16 h-16 rounded-full bg-[#027A4C] items-center justify-center mb-3">
                                        <Text className="text-white text-2xl font-bold">
                                            {selectedUser?.avatar}
                                        </Text>
                                    </View>
                                    <Text className="text-gray-900 text-lg font-semibold">
                                        {selectedUser?.name}
                                    </Text>
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

                                <TouchableOpacity
                                    onPress={() => setSelectedUser(null)}
                                    className="p-3 rounded-xl bg-gray-100 items-center"
                                >
                                    <Text className="text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Message Options Modal */}
            <Modal
                visible={!!selectedMessage}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedMessage(null)}
            >
                <TouchableWithoutFeedback onPress={() => setSelectedMessage(null)}>
                    <View className="flex-1 bg-black/50 items-center justify-center p-6">
                        <TouchableWithoutFeedback>
                            <View className="w-full bg-white rounded-2xl p-6 gap-4">
                                <Text className="text-gray-900 text-lg font-semibold mb-2">Message Options</Text>
                                <Text className="text-gray-600 text-sm mb-4">
                                    {selectedMessage?.message}
                                </Text>

                                {selectedMessage?.sender === 'user' && (
                                    <TouchableOpacity
                                        onPress={handleDeleteMessage}
                                        className="flex-row items-center gap-3 p-3 rounded-xl bg-red-50"
                                    >
                                        <X size={18} color="#EF4444" strokeWidth={1.5} />
                                        <Text className="flex-1 text-red-600 text-sm font-medium">Delete Message</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    onPress={() => setSelectedMessage(null)}
                                    className="p-3 rounded-xl bg-gray-100 items-center"
                                >
                                    <Text className="text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal >

            {/* Image Viewer */}
            {
                viewerImage && (
                    <ImageViewer
                        image={viewerImage}
                        onClose={() => setViewerImage(null)}
                    />
                )
            }
        </SafeAreaView >
    );
}




