import io, { Socket } from 'socket.io-client';
import { BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket;

export const socketService = {
    connect: async () => {
        if (socket && socket.connected) return socket;

        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;

        // Base URL is http://IP:5000/api -> we need http://IP:5000
        const socketUrl = BASE_URL.replace('/api', '');

        socket = io(socketUrl, {
            auth: { token },
            query: { userId: user?._id },
            transports: ['websocket'], // Force websocket
            jsonp: false
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
