import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Lock,
  LogOut,
  ChevronRight,
  ArrowLeft
} from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    password: '',
    block: '',
    street: '',
    houseNo: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('👤 ProfileScreen: Loading profile...');
      const data = await api.profile.get();
      console.log('👤 ProfileScreen: Profile loaded successfully');
      setProfile(data);
    } catch (error: any) {
      console.error('👤 ProfileScreen: Error loading profile:', error);
      Alert.alert(
        'Profile Load Error',
        `Could not load profile: ${error.message}\n\nYou can still logout if needed.`,
        [
          { text: 'Retry', onPress: () => loadProfile() },
          { text: 'OK', style: 'cancel' }
        ]
      );
      // Set minimal profile data so UI can still render logout option
      // Set minimal profile data so UI can still render logout option
      // setProfile({
      //   name: 'User',
      //   email: 'Error loading profile',
      //   phone: 'N/A',
      //   address: 'N/A'
      // });
      // Keep profile null so error UI shows
    } finally {
      setLoading(false);
    }
  };

  const { logout } = useAuth(); // Get logout from context

  const onLogout = async () => {
    try {
      console.log('🚪 Logout initiated');
      await logout(); // Use context logout to update state
      console.log('✅ Tokens cleared. State updated.');
      // No need to manually navigate - AppNavigator will handle it when user state becomes null
    } catch (error: any) {
      console.error('Logout Error:', error);
      Alert.alert('Logout Error', 'Failed to logout: ' + (error.message || 'Unknown error'));

      // Fallback: Check if we can just clear storage manually if context fails
      try {
        await api.auth.logout();
      } catch (e) {
        console.error('Fallback logout failed:', e);
      }
    }
  };

  if (loading) return <View className="h-full flex items-center justify-center"><ActivityIndicator size="large" color="#027A4C" /></View>;
  if (!profile) return (
    <View className="h-full flex items-center justify-center bg-white space-y-4">
      <Text className="text-red-500 text-lg">Failed to load profile</Text>
      <TouchableOpacity
        onPress={loadProfile}
        className="bg-[#027A4C] px-6 py-3 rounded-xl"
      >
        <Text className="text-white font-semibold">Retry</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onLogout}
        className="bg-red-500 px-6 py-3 rounded-xl"
      >
        <Text className="text-white font-semibold">Log Out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#003E2F', '#005C3C', '#027A4C']}
        className="px-6 pt-12 pb-16 rounded-b-[32px]"
      >
        <View className="flex-row items-center mb-8 gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="white" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-semibold">
            Profile
          </Text>
        </View>

        <View className="items-center">
          <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-4">
            <User size={48} color="white" strokeWidth={1.5} />
          </View>
          <Text className="text-white mb-2 text-xl font-semibold">
            {profile.name}
          </Text>

        </View>
      </LinearGradient>

      <ScrollView className="px-6 -mt-8 space-y-4 flex-1">
        {/* Personal Information */}
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <Text className="text-gray-900 mb-4 text-base font-semibold">
            Personal Information
          </Text>
          <View className="space-y-4">
            <View className="flex-row items-center gap-4">
              <View className="w-11 h-11 rounded-xl items-center justify-center bg-[#F1F8F4]">
                <Phone size={20} color="#027A4C" strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 mb-1 text-xs">
                  Phone
                </Text>
                <Text className="text-gray-900 text-sm font-medium">
                  {profile.phone || 'N/A'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4">
              <View className="w-11 h-11 rounded-xl items-center justify-center bg-[#F1F8F4]">
                <Mail size={20} color="#027A4C" strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 mb-1 text-xs">
                  Email
                </Text>
                <Text className="text-gray-900 text-sm font-medium">
                  {profile.email}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4">
              <View className="w-11 h-11 rounded-xl items-center justify-center bg-[#F1F8F4]">
                <MapPin size={20} color="#027A4C" strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 mb-1 text-xs">
                  Address
                </Text>
                <Text className="text-gray-900 text-sm font-medium">
                  {profile.address || 'N/A'}
                </Text>
                {/* Removed hardcoded UrbanEase line */}
              </View>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View className="bg-white rounded-2xl p-2 shadow-sm mb-8">
          <TouchableOpacity
            onPress={() => navigation.navigate("EditProfile")}
            className="w-full flex-row items-center gap-4 p-4 rounded-xl"
            activeOpacity={0.7}
          >
            <View className="w-11 h-11 rounded-xl items-center justify-center bg-[#E3F2FD]">
              <Edit size={20} color="#2196F3" strokeWidth={1.5} />
            </View>
            <Text className="flex-1 text-left text-gray-900 text-[15px] font-medium">
              Edit Profile
            </Text>
            <ChevronRight size={20} color="#9CA3AF" strokeWidth={1.5} />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full flex-row items-center gap-4 p-4 rounded-xl"
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View className="w-11 h-11 rounded-xl items-center justify-center bg-[#F3E5F5]">
              <Lock size={20} color="#9C27B0" strokeWidth={1.5} />
            </View>
            <Text className="flex-1 text-left text-gray-900 text-[15px] font-medium">
              Change Password
            </Text>
            <ChevronRight size={20} color="#9CA3AF" strokeWidth={1.5} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onLogout}
            className="w-full flex-row items-center gap-4 p-4 rounded-xl"
            activeOpacity={0.7}
          >
            <View className="w-11 h-11 rounded-xl items-center justify-center bg-[#FFEBEE]">
              <LogOut size={20} color="#F44336" strokeWidth={1.5} />
            </View>
            <Text className="flex-1 text-left text-[#F44336] text-[15px] font-medium">
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View className="items-center py-4 mb-8">
          <Text className="text-gray-400 text-[13px]">
            UrbanEase v1.0.0
          </Text>
          <Text className="text-gray-400 text-xs">
            UrbanEase
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}