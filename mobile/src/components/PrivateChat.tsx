import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';

export default function PrivateChat() {
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<any[]>([]);
  const [chatRequests, setChatRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'requests'>('chats');

  useEffect(() => {
    loadCachedInbox();
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadCachedInbox = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('cachedInbox');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (parsedData && parsedData.length > 0) {
          setConversations(parsedData);
          setLoading(false);
        }
      }
    } catch (error) {
      console.log('Failed to load cached inbox');
    }
  };

  const loadData = async () => {
    await Promise.all([loadInbox(), loadRequests()]);
  };

  const loadInbox = async () => {
    try {
      const data = await api.chat.getInbox();
      setConversations(data);
      await AsyncStorage.setItem('cachedInbox', JSON.stringify(data));
    } catch (error) {
      console.error(error);
    } finally {
      if (activeTab === 'chats') setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const data = await api.chat.getRequests();
      setChatRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      if (activeTab === 'requests') setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.chat.respondToRequest(requestId, 'accepted');
      await loadData();
      Alert.alert('Success', 'Request accepted! You can now chat.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.chat.respondToRequest(requestId, 'rejected');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject request');
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length > 1 && activeTab === 'chats') {
      handleSearch();
    } else if (searchQuery.trim().length === 0 && activeTab === 'chats') {
      loadInbox();
    }
  }, [searchQuery, activeTab]);

  const handleSearch = async () => {
    try {
      const users = await api.auth.searchUsers(searchQuery);

      const mapped = users.map((u: any) => ({
        id: u._id,
        name: u.name,
        avatar: u.name ? u.name.charAt(0).toUpperCase() : '?',
        lastMessage: 'Tap to check status',
        time: '',
        online: false,
        unreadCount: 0
      }));

      setConversations(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newUsers = mapped.filter((u: any) => !existingIds.has(u.id));
        return [...prev, ...newUsers];
      });
    } catch (e) {
      console.log('Search failed', e);
    }
  };

  const filteredContacts = conversations.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onChatPress = async (contact: any) => {
    if (contact.lastMessage === 'Tap to check status') {
      try {
        const status = await api.chat.getChatStatus(contact.id);
        if (status.status === 'accepted') {
          navigation.navigate('PrivateChatDetail', { chat: contact });
        } else if (status.status === 'pending_sent') {
          Alert.alert('Pending', 'Request already sent.');
        } else if (status.status === 'pending_received') {
          Alert.alert('Request Received', 'Check your Requests tab.');
        } else {
          Alert.alert('Send Request', `Send chat request to ${contact.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Send',
              onPress: async () => {
                await api.chat.sendRequest(contact.id);
                Alert.alert('Sent', 'Request sent!');
              }
            }
          ]);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      navigation.navigate('PrivateChatDetail', { chat: contact });
    }
  };

  if (loading && conversations.length === 0 && chatRequests.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#027A4C" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-2 bg-white border-b border-gray-100">
        <View className="flex-row mb-3 bg-gray-100 p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => setActiveTab('chats')}
            className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'chats' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-semibold ${activeTab === 'chats' ? 'text-[#027A4C]' : 'text-gray-500'}`}>
              Chats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('requests')}
            className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'requests' ? 'bg-white shadow-sm' : ''}`}
          >
            <View className="flex-row items-center gap-1">
              <Text className={`font-semibold ${activeTab === 'requests' ? 'text-[#027A4C]' : 'text-gray-500'}`}>
                Requests
              </Text>
              {chatRequests.length > 0 && (
                <View className="bg-red-500 px-1.5 py-0.5 rounded-full">
                  <Text className="text-white text-[10px] font-bold">{chatRequests.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {activeTab === 'chats' && (
          <TextInput
            placeholder="Search chats..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="bg-gray-100 px-4 py-2 rounded-lg text-base"
          />
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {activeTab === 'chats' ? (
          filteredContacts.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-400 text-base">No active chats</Text>
              <Text className="text-gray-400 text-sm mt-2">Find people in Community Chat</Text>
            </View>
          ) : (
            filteredContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                onPress={() => onChatPress(contact)}
                className="w-full px-6 py-4 border-b border-gray-100 flex-row items-center gap-4"
              >
                <View className="relative">
                  <View className="w-12 h-12 rounded-full items-center justify-center bg-[#027A4C]">
                    <Text className="text-white text-sm font-semibold">
                      {contact.avatar}
                    </Text>
                  </View>
                  {contact.online && (
                    <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#4CAF50] rounded-full border-2 border-white" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 mb-1 text-[15px] font-medium">
                    {contact.name}
                  </Text>
                  <Text className="text-gray-500 text-[13px]" numberOfLines={1}>
                    {contact.lastMessage}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-400 text-[11px]">
                    {contact.time}
                  </Text>
                  {contact.unreadCount > 0 && (
                    <View className="bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5 mt-1">
                      <Text className="text-white text-[11px] font-bold">
                        {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )
        ) : (
          chatRequests.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-400 text-base">No pending requests</Text>
            </View>
          ) : (
            chatRequests.map((req) => (
              <View
                key={req.id}
                className="w-full px-6 py-4 border-b border-gray-100 flex-row items-center gap-4"
              >
                <View className="w-12 h-12 rounded-full items-center justify-center bg-gray-400">
                  <Text className="text-white text-sm font-semibold">
                    {req.sender.avatar}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 mb-1 text-[15px] font-medium">
                    {req.sender.name}
                  </Text>
                  <Text className="text-gray-500 text-[13px]">
                    Wants to chat with you
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleRejectRequest(req.id)}
                    className="w-9 h-9 items-center justify-center bg-gray-100 rounded-full"
                  >
                    <X size={18} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAcceptRequest(req.id)}
                    className="w-9 h-9 items-center justify-center bg-[#027A4C] rounded-full"
                  >
                    <Check size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}
