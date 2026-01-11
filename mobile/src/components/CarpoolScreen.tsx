import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, User, Car, Clock, Phone, MapPin, Plus, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../services/api';

interface CarpoolListing {
    _id: string;
    name: string;
    contactNumber: string;
    vehicleType: string;
    vehicleNumber: string;
    seatsAvailable: number;
    availableDays: string[];
    timeSlot: string;
    destination: string;
    provider: string; // userId
}

export default function CarpoolScreen() {
    const navigation = useNavigation<any>();
    const [listings, setListings] = useState<CarpoolListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleContacts, setVisibleContacts] = useState<{ [key: string]: boolean }>({});
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchListings();
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUserId(user._id || user.id);
            }
        } catch (e) { }
    };

    const fetchListings = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            // Use dynamic BASE_URL
            console.log('Fetching carpools from:', `${BASE_URL}/carpool`);
            const response = await fetch(`${BASE_URL}/carpool`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setListings(data);
            } else {
                setListings([]);
            }
        } catch (error) {
            console.error('Failed to load carpool listings', error);
            Alert.alert('Error', 'Failed to load carpool listings');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleContact = (id: string) => {
        setVisibleContacts(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Delete Listing',
            'Are you sure you want to delete your carpool offer?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            const response = await fetch(`${BASE_URL}/carpool/${id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });

                            if (response.ok) {
                                Alert.alert('Success', 'Listing removed');
                                setListings(prev => prev.filter(item => item._id !== id));
                            } else {
                                Alert.alert('Error', 'Failed to remove listing');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Error removing listing');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View className="h-full bg-gray-50 flex-1">
            {/* Header */}
            <View className="bg-white px-4 pt-12 pb-4 flex-row items-center justify-between shadow-sm border-b border-gray-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="p-2 bg-gray-50 rounded-full"
                    >
                        <ArrowLeft size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">Carpooling</Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate('CarpoolForm')}
                    className="bg-[#027A4C] h-10 w-10 rounded-full items-center justify-center shadow-sm"
                >
                    <Plus size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
                {isLoading ? (
                    <View className="flex-1 justify-center items-center pt-20">
                        <ActivityIndicator size="large" color="#027A4C" />
                    </View>
                ) : listings.length === 0 ? (
                    <View className="items-center py-20 px-6">
                        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
                            <Car size={40} color="#9CA3AF" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900 mb-2">No Rides Available</Text>
                        <Text className="text-gray-500 text-center mb-6 leading-6">
                            Be the first to offer a carpool ride to your neighbors!
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CarpoolForm')}
                            className="px-8 py-3 bg-[#027A4C] rounded-xl"
                        >
                            <Text className="text-white font-semibold">Offer Carpool</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        {listings.map(item => (
                            <View key={item._id} className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
                                {currentUserId === item.provider && (
                                    <TouchableOpacity
                                        onPress={() => handleDelete(item._id)}
                                        className="absolute top-4 right-4 z-10"
                                    >
                                        <Trash2 size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                )}

                                <View className="flex-row items-center gap-3 mb-4">
                                    <View className="w-12 h-12 bg-[#F1F8F4] rounded-full items-center justify-center">
                                        <User size={24} color="#027A4C" />
                                    </View>
                                    <View>
                                        <Text className="font-bold text-gray-900 text-base">{item.name}</Text>
                                        <View className="flex-row items-center gap-1 mt-1">
                                            <Car size={14} color="#6B7280" />
                                            <Text className="text-xs text-gray-500">
                                                {item.vehicleType} • {item.seatsAvailable} Seats
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="space-y-3 mb-4">
                                    <View className="flex-row items-start gap-3">
                                        <Clock size={18} color="#9CA3AF" style={{ marginTop: 2 }} />
                                        <View>
                                            <Text className="text-sm font-medium text-gray-900">{item.timeSlot}</Text>
                                            <View className="flex-row flex-wrap gap-1 mt-2">
                                                {item.availableDays.map(day => (
                                                    <View key={day} className="bg-gray-100 px-2 py-1 rounded">
                                                        <Text className="text-[10px] text-gray-600 font-medium">{day}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    </View>

                                    {item.destination && (
                                        <View className="flex-row items-start gap-3">
                                            <MapPin size={18} color="#9CA3AF" style={{ marginTop: 2 }} />
                                            <Text className="text-sm text-gray-700 flex-1">To: {item.destination}</Text>
                                        </View>
                                    )}
                                </View>

                                {visibleContacts[item._id] ? (
                                    <View className="bg-[#F1F8F4] p-3 rounded-xl flex-row items-center justify-between">
                                        <Text className="font-bold text-[#027A4C] text-lg">{item.contactNumber}</Text>
                                        <View className="bg-white p-2 rounded-full">
                                            <Phone size={16} color="#027A4C" />
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => toggleContact(item._id)}
                                        className="w-full py-3 border border-[#027A4C] rounded-xl items-center"
                                    >
                                        <Text className="text-[#027A4C] font-semibold">View Contact</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
