import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { ArrowLeft, Send, Paperclip, Smile } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const messages = [
  { id: 1, sender: 'admin', name: 'Admin', message: 'Welcome to Green Valley Community Chat!', time: '10:00 AM', avatar: 'A' },
  { id: 2, sender: 'user', name: 'Sarah Ali', message: 'Good morning everyone!', time: '10:15 AM', avatar: 'S' },
  { id: 3, sender: 'user', name: 'Zainab Bibi', message: 'Has anyone seen my car keys? I think I dropped them near the park.', time: '10:20 AM', avatar: 'ZB' },
  { id: 4, sender: 'user', name: 'Fatima Hassan', message: 'No, I haven\'t seen them. Will let you know if I find them.', time: '10:25 AM', avatar: 'F' },
  { id: 5, sender: 'user', name: 'Ali Raza', message: 'The community event was great yesterday! Thanks to everyone who participated.', time: '11:00 AM', avatar: 'AR' },
  { id: 6, sender: 'user', name: 'Sarah Ali', message: 'Yes! Looking forward to the next one.', time: '11:05 AM', avatar: 'S' },
];

export default function ChatScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [messageText, setMessageText] = useState('');

  const handleSend = () => {
    if (messageText.trim()) {
      // Mock send
      setMessageText('');
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#00c878', '#00e68a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-6 pb-4"
      >
        <View className="flex-row items-center" style={{ gap: 16 }}>
          <TouchableOpacity onPress={() => onNavigate('home')}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-lg font-semibold mb-1">Community Chat</Text>
            <Text className="text-white/90 text-sm">256 members</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Messages */}
      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ gap: 16 }}>
        {messages.map((msg) => (
          <View key={msg.id} className={`flex-row ${msg.sender === 'admin' ? 'justify-center' : ''}`} style={{ gap: 12 }}>
            {msg.sender !== 'admin' && (
              <View className="w-10 h-10 rounded-full bg-[#00c878] items-center justify-center">
                <Text className="text-white text-sm font-semibold">{msg.avatar}</Text>
              </View>
            )}
            <View className={`flex-1 ${msg.sender === 'admin' ? 'max-w-[80%]' : 'max-w-[75%]'}`}>
              {msg.sender !== 'admin' && (
                <Text className="text-gray-600 text-sm mb-1">{msg.name}</Text>
              )}
              <View
                className={`p-4 rounded-3xl ${msg.sender === 'admin'
                  ? 'bg-gray-200'
                  : msg.name === 'Zainab Bibi'
                    ? 'bg-[#00c878] rounded-tl-md'
                    : 'bg-white rounded-tl-md'
                  }`}
              >
                <Text className={`${msg.sender === 'admin' ? 'text-gray-700 text-center' : msg.name === 'Zainab Bibi' ? 'text-white' : 'text-gray-900'}`}>
                  {msg.message}
                </Text>
              </View>
              <Text className="text-gray-400 text-xs mt-1">{msg.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input Bar */}
      <View className="bg-white border-t border-gray-200 p-4 pb-8">
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <TouchableOpacity>
            <Paperclip size={24} color="#9CA3AF" />
          </TouchableOpacity>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full"
          />
          <TouchableOpacity>
            <Smile size={24} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSend} activeOpacity={0.8}>
            <LinearGradient
              colors={['#00c878', '#00e68a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-12 h-12 rounded-full items-center justify-center"
            >
              <Send size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
