import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';

export default function PrivateChat() {
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCachedInbox();
    loadInbox();
    // Refresh inbox every 5 seconds
    const interval = setInterval(loadInbox, 5000);
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

  const loadInbox = async () => {
    try {
      const data = await api.chat.getInbox();
      setConversations(data);
      // Update cache
      await AsyncStorage.setItem('cachedInbox', JSON.stringify(data));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      handleSearch();
    } else if (searchQuery.trim().length === 0) {
      // If search query is cleared, reload the inbox to show original contacts
      loadInbox();
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    try {
      const users = await api.auth.searchUsers(searchQuery);
      // Transform to match contact format
      const mapped = users.map((u: any) => ({
        id: u._id,
        name: u.name,
        avatar: u.name ? u.name.charAt(0).toUpperCase() : '?',
        lastMessage: 'Tap to start chatting',
        time: '',
        online: false,
        unreadCount: 0
      }));

      setConversations(prev => {
        // Filter out duplicates (already in inbox)
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

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#027A4C" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {filteredContacts.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-400 text-base">No conversations yet</Text>
            <Text className="text-gray-400 text-sm mt-2">Start a chat from Community Chat</Text>
          </View>
        ) : (
          filteredContacts.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              onPress={() => navigation.navigate('PrivateChatDetail', { chat: contact })}
              className="w-full px-6 py-4 border-b border-gray-100 flex-row items-center gap-4"
            >
              <View className="relative">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center bg-[#027A4C]"
                >
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
        )}
      </ScrollView>
    </View>
  );
}




