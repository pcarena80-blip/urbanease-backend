import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { ArrowLeft, Car, Calendar, Clock, MapPin, Users, Plus, Trash2, ChevronDown } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../services/api';

// Profanity filter - basic list of offensive words
const PROFANITY_LIST = [
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'bastard', 'crap',
    'dick', 'piss', 'slut', 'whore', 'cock', 'pussy', 'fag',
    'nigger', 'retard', 'idiot', 'stupid', 'moron', 'dumb'
];

const containsProfanity = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return PROFANITY_LIST.some(word => lowerText.includes(word));
};

// Dropdown Component
interface DropdownProps {
    value: string;
    options: string[];
    onSelect: (value: string) => void;
    placeholder: string;
}

const Dropdown: React.FC<DropdownProps> = ({ value, options, onSelect, placeholder }) => {
    const [visible, setVisible] = useState(false);

    return (
        <View>
            <TouchableOpacity
                onPress={() => setVisible(true)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 flex-row justify-between items-center"
            >
                <Text className={value ? 'text-gray-900' : 'text-gray-400'}>
                    {value || placeholder}
                </Text>
                <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <Modal visible={visible} transparent animationType="fade">
                <TouchableOpacity
                    className="flex-1 bg-black/50 justify-center items-center"
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View className="bg-white rounded-2xl w-4/5 max-h-80 overflow-hidden">
                        <FlatList
                            data={options}
                            keyExtractor={(item, index) => `${item}-${index}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        onSelect(item);
                                        setVisible(false);
                                    }}
                                    className={`px-4 py-3 border-b border-gray-100 ${value === item ? 'bg-[#027A4C]/10' : ''}`}
                                >
                                    <Text className={`text-base ${value === item ? 'text-[#027A4C] font-semibold' : 'text-gray-900'}`}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

// Time options for schedule
const TIME_OPTIONS = [
    '6:00', '6:30', '7:00', '7:30', '8:00', '8:30', '9:00', '9:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '1:00', '1:30',
    '2:00', '2:30', '3:00', '3:30', '4:00', '4:30', '5:00', '5:30'
];
const PERIOD_OPTIONS = ['AM', 'PM'];
const VEHICLE_TYPES = ['Car', 'Jeep', 'SUV'];

export default function CarpoolFormScreen() {
    const navigation = useNavigation<any>();
    const [formData, setFormData] = useState({
        contactNumber: '',
        vehicleType: 'Car',
        vehicleName: '',
        vehicleNumber: '',
        seatingCapacity: '4',
        seatsAvailable: '3',
        tripType: 'two-way' as 'one-way' | 'two-way', // NEW: Trip type
        schedule: [] as { day: string, goingTime: string, goingPeriod: string, returnTime?: string, returnPeriod?: string }[],
        pickupLocation: 'Urban E Society', // Fixed departure location
        destination: ''
    });

    const [currentSlot, setCurrentSlot] = useState({
        day: 'Mon',
        goingTime: '',
        goingPeriod: 'AM',
        returnTime: '',
        returnPeriod: 'PM'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Contact number validation - must be exactly 10 digits
    const handleContactChange = (text: string) => {
        // Remove any non-digit characters
        const digits = text.replace(/\D/g, '');
        // Limit to 10 digits
        const limited = digits.slice(0, 10);
        setFormData({ ...formData, contactNumber: limited });
    };

    const validateContact = (): boolean => {
        if (formData.contactNumber.length !== 10) {
            Alert.alert('Invalid Contact', 'Please enter exactly 10 digits after +92');
            return false;
        }
        return true;
    };

    const validateVehicleName = (): boolean => {
        if (containsProfanity(formData.vehicleName)) {
            Alert.alert('Invalid Vehicle Name', 'Please remove inappropriate language from the vehicle name');
            return false;
        }
        return true;
    };

    const addSlot = () => {
        if (!currentSlot.goingTime) {
            Alert.alert('Error', 'Please select going time');
            return;
        }
        // Return time only required for two-way trips
        if (formData.tripType === 'two-way' && !currentSlot.returnTime) {
            Alert.alert('Error', 'Please select return time for two-way trip');
            return;
        }

        const newSlot = {
            day: currentSlot.day,
            goingTime: currentSlot.goingTime,
            goingPeriod: currentSlot.goingPeriod,
            ...(formData.tripType === 'two-way' ? {
                returnTime: currentSlot.returnTime,
                returnPeriod: currentSlot.returnPeriod
            } : {})
        };

        setFormData(prev => ({
            ...prev,
            schedule: [...prev.schedule, newSlot]
        }));
        setCurrentSlot(prev => ({ ...prev, goingTime: '', returnTime: '' }));
    };

    const removeSlot = (index: number) => {
        setFormData(prev => ({
            ...prev,
            schedule: prev.schedule.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        if (!formData.contactNumber || !formData.vehicleName || !formData.vehicleNumber || !formData.destination) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (!validateContact()) return;
        if (!validateVehicleName()) return;

        if (parseInt(formData.seatingCapacity) > 4) {
            Alert.alert('Error', 'Seating capacity cannot exceed 4');
            return;
        }

        if (formData.schedule.length === 0) {
            Alert.alert('Error', `Please add at least one schedule slot${formData.tripType === 'two-way' ? ' with going and return times' : ''}`);
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const payload = {
                ...formData,
                contactNumber: `+92${formData.contactNumber}`,
                seatingCapacity: parseInt(formData.seatingCapacity),
                seatsAvailable: parseInt(formData.seatsAvailable),
                tripType: formData.tripType // Include trip type
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

            Alert.alert('Success', 'Carpool listing created!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="h-full bg-gray-50 flex-1">
            <View className="bg-white px-4 pt-12 pb-4 flex-row items-center gap-3 shadow-sm border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-gray-50 rounded-full">
                    <ArrowLeft size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Offer Carpool</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>

                    {/* Contact Info */}
                    <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
                        <View className="flex-row items-center gap-2 mb-3">
                            <Users size={16} color="#6B7280" />
                            <Text className="text-xs font-bold text-gray-500 uppercase">Contact</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="px-4 py-3 bg-gray-100 rounded-l-xl border border-r-0 border-gray-200">
                                <Text className="text-gray-700 font-medium">+92</Text>
                            </View>
                            <TextInput
                                className="flex-1 px-4 py-3 rounded-r-xl bg-gray-50 border border-gray-200 text-gray-900"
                                placeholder="3010816345 (10 digits)"
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={formData.contactNumber}
                                onChangeText={handleContactChange}
                            />
                        </View>
                        <Text className="text-xs text-gray-400 mt-1 ml-1">Enter exactly 10 digits after +92</Text>
                    </View>

                    {/* Vehicle Info */}
                    <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
                        <View className="flex-row items-center gap-2 mb-3">
                            <Car size={16} color="#6B7280" />
                            <Text className="text-xs font-bold text-gray-500 uppercase">Vehicle (Max 4 Seats)</Text>
                        </View>

                        {/* Vehicle Type - Dropdown */}
                        <View className="mb-3">
                            <Text className="text-xs text-gray-500 mb-1 ml-1">Vehicle Type</Text>
                            <Dropdown
                                value={formData.vehicleType}
                                options={VEHICLE_TYPES}
                                onSelect={(value) => setFormData({ ...formData, vehicleType: value })}
                                placeholder="Select Vehicle Type"
                            />
                        </View>

                        {/* Vehicle Name */}
                        <View className="mb-3">
                            <Text className="text-xs text-gray-500 mb-1 ml-1">Vehicle Name</Text>
                            <TextInput
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900"
                                value={formData.vehicleName}
                                onChangeText={text => setFormData({ ...formData, vehicleName: text })}
                                placeholder="e.g. Honda City, Toyota Corolla"
                            />
                        </View>

                        {/* Registration No & Capacity */}
                        <View className="flex-row gap-3 mb-3">
                            <View className="flex-1">
                                <Text className="text-xs text-gray-500 mb-1 ml-1">Registration No.</Text>
                                <TextInput
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900"
                                    value={formData.vehicleNumber}
                                    onChangeText={text => {
                                        // Format: ABC-123 (3 uppercase letters, dash, 3 digits)
                                        const upper = text.toUpperCase();
                                        const cleaned = upper.replace(/[^A-Z0-9-]/g, '');
                                        // Extract letters and numbers separately
                                        const letters = cleaned.replace(/[^A-Z]/g, '').substring(0, 3);
                                        const numbers = cleaned.replace(/[^0-9]/g, '').substring(0, 3);
                                        // Build formatted string
                                        let formatted = letters;
                                        if (letters.length === 3 && numbers.length > 0) {
                                            formatted = letters + '-' + numbers;
                                        }
                                        setFormData({ ...formData, vehicleNumber: formatted });
                                    }}
                                    placeholder="ABC-123"
                                    autoCapitalize="characters"
                                    maxLength={7}
                                />
                                <Text className="text-xs text-gray-400 mt-0.5 ml-1">Format: ABC-123</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-gray-500 mb-1 ml-1">Capacity</Text>
                                <TextInput
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900"
                                    value={formData.seatingCapacity}
                                    onChangeText={text => setFormData({ ...formData, seatingCapacity: text })}
                                    keyboardType="numeric"
                                    placeholder="Max 4"
                                />
                            </View>
                        </View>

                        {/* Seats Available */}
                        <View>
                            <Text className="text-xs text-gray-500 mb-1 ml-1">Seats Available</Text>
                            <TextInput
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900"
                                value={formData.seatsAvailable}
                                onChangeText={text => setFormData({ ...formData, seatsAvailable: text })}
                                keyboardType="numeric"
                                placeholder="e.g. 3"
                            />
                        </View>
                    </View>

                    {/* Trip Type Selector - NEW */}
                    <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
                        <View className="flex-row items-center gap-2 mb-3">
                            <MapPin size={16} color="#6B7280" />
                            <Text className="text-xs font-bold text-gray-500 uppercase">Trip Type</Text>
                        </View>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setFormData({ ...formData, tripType: 'two-way', schedule: [] })}
                                className={`flex-1 py-4 rounded-xl border-2 items-center ${formData.tripType === 'two-way' ? 'border-[#027A4C] bg-[#F1F8F4]' : 'border-gray-200 bg-gray-50'}`}
                            >
                                <Text className="text-xl mb-1">🔄</Text>
                                <Text className={`font-semibold ${formData.tripType === 'two-way' ? 'text-[#027A4C]' : 'text-gray-600'}`}>Two-Way</Text>
                                <Text className="text-xs text-gray-400 mt-1">Going & Return</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setFormData({ ...formData, tripType: 'one-way', schedule: [] })}
                                className={`flex-1 py-4 rounded-xl border-2 items-center ${formData.tripType === 'one-way' ? 'border-[#027A4C] bg-[#F1F8F4]' : 'border-gray-200 bg-gray-50'}`}
                            >
                                <Text className="text-xl mb-1">➡️</Text>
                                <Text className={`font-semibold ${formData.tripType === 'one-way' ? 'text-[#027A4C]' : 'text-gray-600'}`}>One-Way</Text>
                                <Text className="text-xs text-gray-400 mt-1">Going Only</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Dynamic Schedule */}
                    <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
                        <View className="flex-row items-center gap-2 mb-3">
                            <Calendar size={16} color="#6B7280" />
                            <Text className="text-xs font-bold text-gray-500 uppercase">
                                Schedule {formData.tripType === 'two-way' ? '(Going & Return)' : '(Going Only)'}
                            </Text>
                        </View>

                        {/* Day Selector */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                            {days.map(day => (
                                <TouchableOpacity
                                    key={day}
                                    onPress={() => setCurrentSlot(prev => ({ ...prev, day }))}
                                    className={`mr-2 px-4 py-2 rounded-lg ${currentSlot.day === day ? 'bg-[#027A4C]' : 'bg-gray-100'}`}
                                >
                                    <Text className={`text-sm font-medium ${currentSlot.day === day ? 'text-white' : 'text-gray-600'}`}>
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Going Time */}
                        <View className="mb-4">
                            <Text className="text-xs font-semibold text-[#027A4C] mb-2">🚗 DEPARTURE (Going)</Text>
                            <View className="flex-row gap-2">
                                <View className="flex-1">
                                    <Text className="text-xs text-gray-500 mb-1">Time</Text>
                                    <Dropdown
                                        value={currentSlot.goingTime}
                                        options={TIME_OPTIONS}
                                        onSelect={(value) => setCurrentSlot(prev => ({ ...prev, goingTime: value }))}
                                        placeholder="Select"
                                    />
                                </View>
                                <View className="w-20">
                                    <Text className="text-xs text-gray-500 mb-1">AM/PM</Text>
                                    <Dropdown
                                        value={currentSlot.goingPeriod}
                                        options={PERIOD_OPTIONS}
                                        onSelect={(value) => setCurrentSlot(prev => ({ ...prev, goingPeriod: value }))}
                                        placeholder="AM"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Return Time - Only for two-way trips */}
                        {formData.tripType === 'two-way' && (
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-orange-600 mb-2">🏠 RETURN (Coming Back)</Text>
                                <View className="flex-row gap-2">
                                    <View className="flex-1">
                                        <Text className="text-xs text-gray-500 mb-1">Time</Text>
                                        <Dropdown
                                            value={currentSlot.returnTime}
                                            options={TIME_OPTIONS}
                                            onSelect={(value) => setCurrentSlot(prev => ({ ...prev, returnTime: value }))}
                                            placeholder="Select"
                                        />
                                    </View>
                                    <View className="w-20">
                                        <Text className="text-xs text-gray-500 mb-1">AM/PM</Text>
                                        <Dropdown
                                            value={currentSlot.returnPeriod}
                                            options={PERIOD_OPTIONS}
                                            onSelect={(value) => setCurrentSlot(prev => ({ ...prev, returnPeriod: value }))}
                                            placeholder="PM"
                                        />
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Add Slot Button */}
                        <TouchableOpacity
                            onPress={addSlot}
                            className="bg-[#027A4C] py-3 rounded-xl items-center flex-row justify-center gap-2 mb-4"
                        >
                            <Plus size={20} color="white" />
                            <Text className="text-white font-semibold">Add Schedule for {currentSlot.day}</Text>
                        </TouchableOpacity>

                        {/* Slots List */}
                        {formData.schedule.length > 0 && (
                            <View className="border-t border-gray-100 pt-3">
                                <Text className="text-xs font-bold text-gray-500 mb-2">ADDED SCHEDULES:</Text>
                                {formData.schedule.map((slot, index) => (
                                    <View key={index} className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl mb-2">
                                        <View>
                                            <Text className="text-gray-900 font-semibold">{slot.day}</Text>
                                            <Text className="text-xs text-gray-600">
                                                {formData.tripType === 'two-way'
                                                    ? `Go: ${slot.goingTime} ${slot.goingPeriod} → Return: ${slot.returnTime} ${slot.returnPeriod}`
                                                    : `Going: ${slot.goingTime} ${slot.goingPeriod} (One-Way)`
                                                }
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => removeSlot(index)}>
                                            <Trash2 size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Route */}
                    <View className="bg-white p-4 rounded-2xl mb-6 shadow-sm border border-gray-100">
                        <View className="flex-row items-center gap-2 mb-3">
                            <MapPin size={16} color="#6B7280" />
                            <Text className="text-xs font-bold text-gray-500 uppercase">Route</Text>
                        </View>
                        <View className="mb-3">
                            <Text className="text-xs text-gray-500 mb-1 ml-1">Departure Location (Fixed)</Text>
                            <View className="w-full px-4 py-3 rounded-xl bg-[#027A4C]/10 border border-[#027A4C]/30 flex-row items-center">
                                <MapPin size={16} color="#027A4C" />
                                <Text className="text-[#027A4C] font-semibold ml-2">{formData.pickupLocation}</Text>
                            </View>
                            <Text className="text-xs text-gray-400 mt-1 ml-1">All carpools depart from Urban E Society</Text>
                        </View>
                        <View>
                            <Text className="text-xs text-gray-500 mb-1 ml-1">Destination</Text>
                            <TextInput
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900"
                                placeholder="Enter your destination"
                                value={formData.destination}
                                onChangeText={text => setFormData({ ...formData, destination: text })}
                            />
                        </View>
                    </View>

                </ScrollView>

                {/* Fixed Submit Button - Always visible above keyboard */}
                <View className="px-4 pb-6 pt-2 bg-gray-50 border-t border-gray-200">
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-xl shadow-lg items-center ${isSubmitting ? 'bg-[#027A4C]/70' : 'bg-[#027A4C]'}`}
                    >
                        <Text className="text-white font-bold text-lg">
                            {isSubmitting ? 'Submitting...' : '✓ Offer Carpool'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
