import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal, Alert, FlatList, RefreshControl, ListRenderItem } from 'react-native';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, User, Car, Clock, Phone, MapPin, Plus, Trash2, Search, X, Flag } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface CarpoolListing {
    _id: string;
    name: string;
    contactNumber: string;
    vehicleType: string;
    vehicleName: string;
    vehicleNumber: string;
    seatingCapacity: number;
    seatsAvailable: number;
    tripType: string;
    schedule: {
        day: string;
        goingTime: string;
        goingPeriod: string;
        returnTime?: string;
        returnPeriod?: string;
    }[];
    pickupLocation: string;
    destination: string;
    provider: string; // userId
}

export default function CarpoolScreen() {
    const navigation = useNavigation<any>();
    const [listings, setListings] = useState<CarpoolListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [visibleContacts, setVisibleContacts] = useState<{ [key: string]: boolean }>({});
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredListings = listings.filter(listing =>
        listing.destination?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useFocusEffect(
        React.useCallback(() => {
            fetchListings();
            loadUser();
        }, [])
    );

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
        if (listings.length === 0) setIsLoading(true);
        try {
            const data = await api.carpool.getAll();
            if (Array.isArray(data)) {
                setListings(data);
            } else {
                setListings([]);
            }
        } catch (error: any) {
            console.error('Failed to load carpool listings', error);
            if (error.message !== 'Not authorized') {
                Alert.alert('Error', 'Failed to load carpool listings');
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchListings();
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
                            await api.carpool.delete(id);
                            Alert.alert('Success', 'Listing removed');
                            setListings(prev => prev.filter(item => item._id !== id));
                        } catch (error: any) {
                             if (error.message !== 'Not authorized') {
                                Alert.alert('Error', 'Failed to remove listing');
                             }
                        }
                    }
                }
            ]
        );
    };

    const handleReport = (id: string) => {
        Alert.alert(
            'Report Listing',
            'Why are you reporting this listing?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Spam / Fake', onPress: () => submitReport(id, 'Spam or Fake Listing') },
                { text: 'Harassment', onPress: () => submitReport(id, 'Harassment or Inappropriate') },
                { text: 'Other', onPress: () => submitReport(id, 'Other Issue') },
            ]
        );
    };

    const submitReport = async (id: string, reason: string) => {
        try {
            await api.carpool.report(id, reason);
            Alert.alert('Report Submitted', 'Thank you for keeping the community safe.');
        } catch (error: any) {
            if (error.message !== 'Not authorized') {
                Alert.alert('Error', error.message || 'Failed to submit report');
            }
        }
    };

    const renderItem: ListRenderItem<CarpoolListing> = ({ item }) => (
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            {currentUserId === item.provider ? (
                <TouchableOpacity
                    onPress={() => handleDelete(item._id)}
                    className="absolute top-4 right-4 z-10"
                >
                    <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={() => handleReport(item._id)}
                    className="absolute top-4 right-4 z-10 p-1"
                >
                    <Flag size={18} color="#9CA3AF" />
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
                            {item.vehicleName} • {item.vehicleType} • {item.seatsAvailable}/{item.seatingCapacity || 4} Left
                        </Text>
                    </View>
                </View>
            </View>

            <View className="space-y-3 mb-4">
                <View className="flex-row items-start gap-3">
                    <Clock size={18} color="#9CA3AF" style={{ marginTop: 2 }} />
                    <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-900 mb-1">
                            Schedule ({item.tripType === 'one-way' ? 'One-Way' : 'Two-Way'})
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                            {item.schedule && item.schedule.map((slot, idx) => (
                                <View key={idx} className="bg-gray-100 px-2 py-1 rounded-md">
                                    <Text className="text-[11px] text-gray-700 font-medium">
                                        {slot.day}: {slot.goingTime} {slot.goingPeriod}
                                        {slot.returnTime ? ` → ${slot.returnTime} ${slot.returnPeriod}` : ''}
                                    </Text>
                                </View>
                            ))}
                            {(!item.schedule || item.schedule.length === 0) && (
                                <Text className="text-xs text-gray-500">Detailed schedule unavailable</Text>
                            )}
                        </View>
                    </View>
                </View>

                <View className="flex-row items-start gap-3">
                    <MapPin size={18} color="#9CA3AF" style={{ marginTop: 2 }} />
                    <View className="flex-1">
                        <Text className="text-sm text-gray-700 font-medium">From: {item.pickupLocation}</Text>
                        {item.destination && (
                            <Text className="text-sm text-gray-700 mt-1">To: {item.destination}</Text>
                        )}
                    </View>
                </View>
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
    );

    const ListEmptyComponent = () => (
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
    );

    return (
        <View className="h-full bg-gray-50 flex-1">
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

            <View className="px-4 pb-4 bg-white border-b border-gray-100 z-10">
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 border border-gray-200">
                    <Search size={20} color="#9CA3AF" />
                    <TextInput
                        placeholder="Search by destination (e.g., F-8, Blue Area)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 ml-3 text-base text-gray-900"
                        placeholderTextColor="#9CA3AF"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {isLoading && listings.length === 0 ? (
                <View className="flex-1 justify-center items-center pt-20">
                    <ActivityIndicator size="large" color="#027A4C" />
                </View>
            ) : (
                <FlatList
                    data={filteredListings}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ListEmptyComponent={ListEmptyComponent}
                    initialNumToRender={5}
                    windowSize={5}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#027A4C"]} />
                    }
                />
            )}
        </View>
    );
}
