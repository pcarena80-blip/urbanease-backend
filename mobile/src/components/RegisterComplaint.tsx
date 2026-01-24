import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { ArrowLeft, Upload, Check, Image as ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterComplaint({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const categories = [
    'Maintenance',
    'Water Supply',
    'Electricity',
    'Security',
    'Garbage Collection',
    'Noise Complaint',
    'Other'
  ];

  const handleSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => {
      onNavigate('complaints');
    }, 2000);
  };

  if (showSuccess) {
    return (
      <View className="flex-1 items-center justify-center px-6 bg-white">
        <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-6">
          <Check size={40} color="#00c878" />
        </View>
        <Text className="text-gray-900 text-xl font-semibold mb-3 text-center">Complaint Registered!</Text>
        <Text className="text-gray-600 text-center">
          Your complaint has been submitted successfully. You will be notified of updates.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#00c878', '#00e68a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-6"
      >
        <TouchableOpacity onPress={() => onNavigate('complaints')} className="mb-4">
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold mb-2">Register Complaint</Text>
        <Text className="text-white/90">Submit your issue</Text>
      </LinearGradient>

      <ScrollView className="flex-1 px-6 py-6">
        <View className="bg-white rounded-3xl p-6" style={{ gap: 20 }}>
          {/* Category Picker */}
          <View>
            <Text className="text-gray-700 mb-2 font-medium">Category</Text>
            <TouchableOpacity
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              className="w-full px-4 py-4 border border-gray-200 rounded-2xl bg-white"
            >
              <Text className={formData.category ? "text-gray-900" : "text-gray-400"}>
                {formData.category || 'Select category'}
              </Text>
            </TouchableOpacity>

            {showCategoryPicker && (
              <View className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
                {categories.map((cat, index) => (
                  <TouchableOpacity
                    key={cat || index}
                    onPress={() => {
                      setFormData({ ...formData, category: cat });
                      setShowCategoryPicker(false);
                    }}
                    className="px-4 py-3 border-b border-gray-100"
                  >
                    <Text className="text-gray-700">{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Title Input */}
          <View>
            <Text className="text-gray-700 mb-2 font-medium">Title</Text>
            <TextInput
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Brief description of the issue"
              placeholderTextColor="#9CA3AF"
              className="w-full px-4 py-4 border border-gray-200 rounded-2xl bg-white"
            />
          </View>

          {/* Description Input */}
          <View>
            <Text className="text-gray-700 mb-2 font-medium">Description</Text>
            <TextInput
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Provide detailed information about your complaint"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="w-full px-4 py-4 border border-gray-200 rounded-2xl bg-white"
              style={{ minHeight: 120 }}
            />
          </View>

          {/* Image Upload */}
          <View>
            <Text className="text-gray-700 mb-3 font-medium">Attach Image (Optional)</Text>
            <TouchableOpacity className="w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl items-center" style={{ gap: 12 }}>
              <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
                <ImageIcon size={24} color="#9CA3AF" />
              </View>
              <View className="items-center">
                <Text className="text-gray-600">Tap to upload image</Text>
                <Text className="text-gray-400 text-sm">JPG, PNG (Max 5MB)</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.8}>
            <LinearGradient
              colors={['#00c878', '#00e68a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-full py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-semibold text-base">Submit Complaint</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
