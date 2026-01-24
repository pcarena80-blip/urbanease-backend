import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { ArrowLeft, Send, Paperclip } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatDetail({
  chat,
  onNavigate
}: {
  chat: any;
  onNavigate: (screen: string) => void;
}) {
  const [messageText, setMessageText] = useState('');

  if (!chat) return null;

  const messages = [
    { id: 1, sender: 'other', message: 'Hello! How can I assist you today?', time: '10:00 AM' },
    { id: 2, sender: 'user', message: 'I need help with my maintenance bill.', time: '10:05 AM' },
    { id: 3, sender: 'other', message: 'Of course! I can help you with that. What seems to be the issue?', time: '10:06 AM' },
    { id: 4, sender: 'user', message: 'I want to know the breakdown of charges.', time: '10:08 AM' },
    { id: 5, sender: 'other', message: 'Sure! I\'ll send you the detailed breakdown right away.', time: '10:10 AM' },
  ];

  const handleSend = () => {
    if (messageText.trim()) {
      setMessageText('');
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <LinearGradient
        colors={['#003E2F', '#027A4C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-6 py-4"
      >
        <View className="flex-row items-center" style={{ gap: 16 }}>
          <TouchableOpacity onPress={() => onNavigate('private-chat')}>
            <ArrowLeft size={24} color="white" strokeWidth={1.5} />
          </TouchableOpacity>
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
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

      {/* Messages */}
      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ gap: 16 }}>
        {messages.map((msg) => (
          <View key={msg.id} className={`flex-row ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <View className={`max-w-[75%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <View
                className={`p-3.5 ${msg.sender === 'user'
                    ? 'bg-[#F1F8F4] rounded-2xl rounded-tr-sm'
                    : 'bg-gray-100 rounded-2xl rounded-tl-sm'
                  }`}
              >
                <Text className={`text-sm ${msg.sender === 'user' ? 'text-[#027A4C]' : 'text-gray-800'}`}>
                  {msg.message}
                </Text>
              </View>
              <Text className="text-gray-400 text-[11px] mt-1">
                {msg.time}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input Bar */}
      <View className="bg-white border-t border-gray-100 p-4 pb-8">
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <TouchableOpacity>
            <Paperclip size={20} color="#9CA3AF" strokeWidth={1.5} />
          </TouchableOpacity>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm"
          />
          <TouchableOpacity onPress={handleSend} activeOpacity={0.8}>
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
  );
}
