import io, { Socket } from 'socket.io-client';
import { API_ORIGIN } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket;

export const socketService = {
    connect: async () => {
        if (socket && socket.connected) return socket;

        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;

        socket = io(API_ORIGIN, {
            auth: { token },
            query: { userId: user?._id },
            transports: ['websocket', 'polling'], // Allow fallback
            jsonp: false,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
            if (user?._id) {
                socket.emit('join_private', user._id);
            }
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err);
        });

        return socket;
    },

    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    },

    getSocket: () => socket,

    // Helper to join community
    joinCommunity: () => {
        if (socket) socket.emit('join_community');
    },

    // Subscribe to event
    on: (event, callback) => {
        if (socket) socket.on(event, callback);
    },

    off: (event) => {
        if (socket) socket.off(event);
    }
};
