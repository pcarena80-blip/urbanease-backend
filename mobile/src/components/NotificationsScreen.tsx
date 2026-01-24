import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal, Alert } from 'react-native';
import { ArrowLeft, Bell, Receipt, MessageSquare, ClipboardList, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function NotificationsScreen() {
    const navigation = useNavigation<any>();

    const notifications: any[] = [];

    return (
        <View className="h-full bg-gray-50">
            {/* Header */}
            <LinearGradient
                colors={['#003E2F', '#027A4C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-6 pt-12 pb-4 rounded-b-[32px]"
            >
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeft size={24} color="white" strokeWidth={1.5} />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-semibold">
                        Notifications
                    </Text>
                </View>
            </LinearGradient>

            {/* Notifications List */}
            <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>
                {notifications.map((notification) => (
                    <View
                        key={notification.id}
                        className={`bg-white rounded-2xl p-4 mb-4 shadow-sm ${!notification.read ? 'border border-[#027A4C]/20' : ''}`}
                    >
                        <View className="flex-row gap-4">
                            <View
                                className="w-12 h-12 rounded-full items-center justify-center"
                                style={{ backgroundColor: notification.bg }}
                            >
                                <notification.icon size={24} color={notification.color} strokeWidth={1.5} />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text className={`text-gray-900 text-[15px] ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                                        {notification.title}
                                    </Text>
                                    <Text className="text-gray-400 text-[11px]">
                                        {notification.time}
                                    </Text>
                                </View>
                                <Text className="text-gray-600 text-[13px] leading-snug">
                                    {notification.description}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}




