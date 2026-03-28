import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal, Alert, AppState } from 'react-native';
import { api, updateApiToken, setOnUnauthorized } from '../services/api';

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

    const logout = useCallback(async () => {
        console.log('🔄 AuthContext: Performing logout');
        setUser(null);
        updateApiToken(null);
        await api.auth.logout();
        
        // Clear cached data
        const cachedKeys = [
            'cachedNotices', 'cachedBills', 'cachedComplaints', 
            'cachedCommunityMessages', 'cachedInbox', 'lastReadCommunityMessageId'
        ];
        for (const key of cachedKeys) {
            await AsyncStorage.removeItem(key);
        }
    }, []);

    useEffect(() => {
        // Handle 401 globally
        setOnUnauthorized(() => {
            console.warn('⚠️ Unauthorized access detected - triggering logout');
            logout();
        });

        loadStorageData();

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                prefetchAppData();
            }
        });

        return () => {
            subscription?.remove();
        };
    }, [logout]);

    const loadStorageData = async () => {
        try {
            const authDataSerialized = await AsyncStorage.getItem('user');
            const token = await AsyncStorage.getItem('token');
            if (authDataSerialized && token) {
                const _authData = JSON.parse(authDataSerialized);
                updateApiToken(token);

                try {
                    const profile = await api.auth.getProfile();
                    if (profile && profile.isVerified) {
                        setUser(_authData);
                        prefetchAppData();
                    } else {
                        console.log('Account not verified - clearing session');
                        await logout();
                    }
                } catch (error: any) {
                    if (error.message === 'Not authorized') {
                        // Already handled by setOnUnauthorized
                    } else {
                        // Keep offline access
                        setUser(_authData);
                    }
                }
            }
        } catch (error) {
            console.error('Auth loading error:', error);
        } finally {
            setLoading(false);
        }
    };

    const prefetchAppData = async () => {
        if (!user || prefetching) return;
        setPrefetching(true);
        try {
            console.log('Prefetching app data...');
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
        updateApiToken(data.token);
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data));
        await prefetchAppData();
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
