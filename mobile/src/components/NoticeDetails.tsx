import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal, Alert } from 'react-native';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';

export default function NoticeDetails() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { notice } = route.params || {};

  if (!notice) return null;

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: '#F44336', label: 'High Priority' };
      case 'medium':
        return { bg: '#FF9800', label: 'Medium' };
      default:
        return { bg: '#9E9E9E', label: 'Low' };
    }
  };

  const config = getPriorityConfig(notice.priority);

  return (
    <View className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#003E2F', '#005C3C', '#027A4C']}
        className="px-6 pt-12 pb-6 rounded-b-[32px]"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
          <ArrowLeft size={24} color="white" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-semibold">
          Notice Details
        </Text>
      </LinearGradient>

      {/* Content */}
      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View
            className="self-start px-4 py-1.5 rounded-full mb-4"
            style={{ backgroundColor: config.bg }}
          >
            <Text className="text-white text-xs font-medium">
              {config.label}
            </Text>
          </View>

          <Text className="text-gray-900 mb-4 text-xl font-semibold">
            {notice.title}
          </Text>

          <View className="flex-row items-center gap-2 mb-6 pb-6 border-b border-gray-100">
            <Calendar size={16} color="#6B7280" strokeWidth={1.5} />
            <Text className="text-gray-500 text-[13px]">
              Posted {notice.date}
            </Text>
          </View>

          <View>
            <Text className="text-gray-700 text-[15px] leading-relaxed mb-4">
              {notice.description}
            </Text>

            {notice.attachment && (
              <View className="mb-4 rounded-xl overflow-hidden bg-gray-100">
                <Image
                  source={{ uri: api.getImageUrl(notice.attachment) }}
                  style={{ width: '100%', height: 200 }}
                  resizeMode="cover"
                />
              </View>
            )}

            <Text className="text-gray-500 text-xs italic mt-2">
              - Management Team
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}




