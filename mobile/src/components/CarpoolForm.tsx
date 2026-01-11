import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, Car, Calendar, Clock, MapPin, Users, CheckSquare, Square } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../services/api';

export default function CarpoolFormScreen() {
    const navigation = useNavigation<any>();
    const [formData, setFormData] = useState({
        contactNumber: '',
        vehicleType: 'Car',
        vehicleNumber: '',
        seatingCapacity: '4',
        seatsAvailable: '3',
        availableDays: [] as string[],
        timeSlot: '',
        destination: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const societyName = "ABC Residency – Main Gate";
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const toggleDay = (day: string) => {
        setFormData(prev => {
            const currentDays = prev.availableDays;
            if (currentDays.includes(day)) {
                return { ...prev, availableDays: currentDays.filter(d => d !== day) };
            } else {
                return { ...prev, availableDays: [...currentDays, day] };
            }
        });
    };

    const handleSubmit = async () => {
        if (!formData.contactNumber || !formData.vehicleNumber || !formData.timeSlot) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (formData.availableDays.length === 0) {
            Alert.alert('Error', 'Please select at least one available day');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('token');
            // Format data (convert strings to numbers)
            const payload = {
                ...formData,
                seatingCapacity: parseInt(formData.seatingCapacity),
                seatsAvailable: parseInt(formData.seatsAvailable)
            };

            const response = await fetch(`${BASE_URL}/carpool`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create listing');
            }

            Alert.alert('Success', 'Carpool listing created successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() } // This will likely go back to CarpoolScreen if pushed from there, or navigate explicitly
            ]);
            // Navigate/refresh logic handled by previous screen reload
            // But we should go back

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="h-full bg-gray-50 flex-1">
            {/* Header */}
            <View className="bg-white px-4 pt-12 pb-4 flex-row items-center gap-3 shadow-sm border-b border-gray-100">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="p-2 bg-gray-50 rounded-full"
                >
                    <ArrowLeft size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Offer Carpool</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Contact Info */}
                    <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
                        <View className="flex-row items-center gap-2 mb-3">
                            <Users size={16} color="#6B7280" />
                            <Text className="text-xs font-bold text-gray-500 uppercase">Contact Details</Text>
                        </View>
                        <View>
                            <Text className="text-sm font-medium text-gray-700 mb-2">Contact Number</Text>
                            <TextInput
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900"
                                placeholder="0300-1234567"
                                keyboardType="phone-pad"
                                value={formData.contactNumber}
                                onChangeText={text => setFormData({ ...formData, contactNumber: text })}
                            />
                            <Text className="text-[10px] text-gray-500 mt-1">Residents will contact you on this number.</Text>
                        </View>
                    </View>

                    {/* Vehicle Info */}
                    <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
                        <View className="flex-row items-center gap-2 mb-3">
                            <Car size={16} color="#6B7280" />
                            <Text className="text-xs font-bold text-gray-500 uppercase">Vehicle Details</Text>
                        </View>

                        <View className="flex-row gap-3 mb-3">
                            <View className="flex-1">
                                <Text className="text-sm font-medium text-gray-700 mb-2">Type</Text>
                                <TextInput
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900"
                                    value={formData.vehicleType}
                                    onChangeText={text => setFormData({ ...formData, vehicleType: text })}
                                    placeholder="Car, Bike..."
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-medium text-gray-700 mb-2">Number</Text>
                                <TextInput
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900"
                                    value={formData.vehicleNumber}
                                    onChangeText={text => setFormData({ ...formData, vehicleNumber: text })}
                                    placeholder="ABC-123"
                                />
                            </View>
                        </View>

                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <Text className="text-sm font-medium text-gray-700 mb-2">Capacity</Text>
                                <TextInput
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900"
                                    value={formData.seatingCapacity}
                                    onChangeText={text => setFormData({ ...formData, seatingCapacity: text })}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-medium text-gray-700 mb-2">Avail. Seats</Text>
                                <TextInput
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900"
                                    value={formData.seatsAvailable}
                                    onChangeText={text => setFormData({ ...formData, seatsAvailable: text })}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Schedule */}
                    <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
                        <View className="flex-row items-center gap-2 mb-3">
                            <Calendar size={16} color="#6B7280" />
                            <Text className="text-xs font-bold text-gray-500 uppercase">Schedule</Text>
                        </View>

                        <Text className="text-sm font-medium text-gray-700 mb-2">Available Days</Text>
                        <View className="flex-row flex-wrap gap-2 mb-4">
                            {days.map(day => (
                                <TouchableOpacity
                                    key={day}
                                    onPress={() => toggleDay(day)}
                                    className={`px-3 py-2 rounded-lg ${formData.availableDays.includes(day)
                                        ? 'bg-[#027A4C]'
                                        : 'bg-gray-100'}`}
                                >
                                    <Text className={`text-xs font-medium ${formData.availableDays.includes(day)
                                        ? 'text-white'
                                        : 'text-gray-600'}`}>
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text className="text-sm font-medium text-gray-700 mb-2">Time Slot</Text>
                        <View className="relative">
                            <Clock size={20} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }} />
                            <TextInput
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900"
                                placeholder="e.g. Morning 8:00 AM"
                                value={formData.timeSlot}
                                onChangeText={text => setFormData({ ...formData, timeSlot: text })}
                            />
                        </View>
                    </View>

                    {/* Route */}
                    <View className="bg-white p-4 rounded-2xl mb-6 shadow-sm border border-gray-100">
                        <View className="flex-row items-center gap-2 mb-3">
                            <MapPin size={16} color="#6B7280" />
                            <Text className="text-xs font-bold text-gray-500 uppercase">Route</Text>
                        </View>

                        <View className="mb-3">
                            <Text className="text-sm font-medium text-gray-700 mb-2">Pickup Location</Text>
                            <TextInput
                                editable={false}
                                className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-500 border border-gray-200"
                                value={societyName}
                            />
                        </View>

                        <View>
                            <Text className="text-sm font-medium text-gray-700 mb-2">Destination (Optional)</Text>
                            <TextInput
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900"
                                placeholder="e.g. Saddar, University"
                                value={formData.destination}
                                onChangeText={text => setFormData({ ...formData, destination: text })}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-xl shadow-lg items-center ${isSubmitting ? 'bg-[#027A4C]/70' : 'bg-[#027A4C]'
                            }`}
                    >
                        <Text className="text-white font-bold text-lg">
                            {isSubmitting ? 'Submitting...' : 'Offer Carpool'}
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
