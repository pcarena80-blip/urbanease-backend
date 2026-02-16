import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal, Alert, AppState } from 'react-native';
import { api } from '../services/api';

interface AuthContextType {
    user: any;
    loading: boolean;
    prefetching: boolean;
    loginSuccessful: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: any) => Promise<void>;
    isAuthenticated: boolean;
    refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [prefetching, setPrefetching] = useState(false);

    useEffect(() => {
        loadStorageData();

        // Listen for app state changes to refresh data when app comes to foreground
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                // App became active, refresh data in background
                prefetchAppData();
            }
        });

        return () => {
            subscription?.remove();
        };
    }, []);

    const loadStorageData = async () => {
        try {
            const authDataSerialized = await AsyncStorage.getItem('user');
            const token = await AsyncStorage.getItem('token');
            if (authDataSerialized && token) {
                const _authData = JSON.parse(authDataSerialized);

                // Verify with server that account is still valid and verified
                try {
                    const profile = await api.auth.getProfile();
                    if (profile && profile.isVerified) {
                        setUser(_authData);
                        prefetchAppData();
                    } else {
                        // User is not verified by admin - force logout
                        console.log('Account not verified by admin - clearing session');
                        await AsyncStorage.removeItem('token');
                        await AsyncStorage.removeItem('user');
                        setUser(null);
                    }
                } catch (error) {
                    // Token invalid or server error - clear session
                    console.log('Session validation failed - clearing session');
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('user');
                    setUser(null);
                }
            }
        } catch (error) {
            console.error('Auth loading error:', error);
        } finally {
            setLoading(false);
        }
    };

    const prefetchAppData = async () => {
        if (prefetching) return;
        setPrefetching(true);
        try {
            console.log('Prefetching app data...');
            // Fetch all critical data in parallel
            // We use allSettled to ensure one failure doesn't stop others
            const results = await Promise.allSettled([
                api.notices.requestNoticesScreen(),
                api.bills.getAll(),
                api.complaints.requestComplaintModule(),
                api.chat.displayChatWindow('community'),
                api.chat.getInbox()
            ]);

            const notices = results[0].status === 'fulfilled' ? results[0].value : [];
            const bills = results[1].status === 'fulfilled' ? results[1].value : [];
            const complaints = results[2].status === 'fulfilled' ? results[2].value : [];
            const communityMessages = results[3].status === 'fulfilled' ? results[3].value : [];
            const inbox = results[4].status === 'fulfilled' ? results[4].value : [];

            // Log failures for debugging but don't block app
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.warn(`Prefetch failed for index ${index}:`, result.reason);
                }
            });

            // Cache data in AsyncStorage for instant load next time
            if (results[0].status === 'fulfilled') await AsyncStorage.setItem('cachedNotices', JSON.stringify(notices));
            if (results[1].status === 'fulfilled') await AsyncStorage.setItem('cachedBills', JSON.stringify(bills));
            if (results[2].status === 'fulfilled') await AsyncStorage.setItem('cachedComplaints', JSON.stringify(complaints));
            if (results[3].status === 'fulfilled') await AsyncStorage.setItem('cachedCommunityMessages', JSON.stringify(communityMessages));
            if (results[4].status === 'fulfilled') await AsyncStorage.setItem('cachedInbox', JSON.stringify(inbox));

            console.log('Data prefetch complete!');
        } catch (error) {
            console.error('Prefetch error:', error);
        } finally {
            setPrefetching(false);
        }
    };

    const loginSuccessful = async (data: any) => {
        setUser(data);
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data));

        // Prefetch data immediately after login
        await prefetchAppData();
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        // Clear cached data
        await AsyncStorage.removeItem('cachedNotices');
        await AsyncStorage.removeItem('cachedBills');
        await AsyncStorage.removeItem('cachedComplaints');
        await AsyncStorage.removeItem('cachedCommunityMessages');
        await AsyncStorage.removeItem('cachedInbox');
    };

    const updateUser = async (data: any) => {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const refreshData = async () => {
        await prefetchAppData();
    };

    return (
        <AuthContext.Provider value={{ user, loading, prefetching, loginSuccessful, logout, updateUser, isAuthenticated: !!user, refreshData }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);



