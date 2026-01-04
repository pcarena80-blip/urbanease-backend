
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AWS EC2 via Cloudflare Tunnel (HTTPS - 24/7 Production)
// AWS EC2 via Cloudflare Tunnel (HTTPS - 24/7 Production)
// const BASE_URL = 'https://musicians-index-vector-reef.trycloudflare.com/api';
// AWS EC2 via Cloudflare Tunnel (HTTPS - 24/7 Production)
// const BASE_URL = 'https://outlet-coverage-burns-abstract.trycloudflare.com/api';
// Local Network Dev (Localtunnel) - INACTIVE (service issues)
// const BASE_URL = 'https://bright-news-shout.loca.lt/api';
// Local Network Dev (Localtunnel)
// const BASE_URL = 'https://new-geese-sleep.loca.lt/api';
// Local Network Dev (Localtunnel)
// const BASE_URL = 'https://new-geese-sleep.loca.lt/api';
// Local Network Dev (Direct WiFi) - ACTIVE
// const BASE_URL = 'http://192.168.18.131:5000/api';
// AWS Direct HTTP - ACTIVE
const BASE_URL = 'http://51.20.34.254:5000/api';
// Cloud Production (Any WiFi/4G)
// const BASE_URL = 'https://urbanease-backend-suham.onrender.com/api';
console.log('🌐 API BASE_URL:', BASE_URL);

// Previous URLs (for reference)
// AWS Direct HTTP: 'http://51.20.34.254:5000/api' (blocked by Android)
// Local Dev: 'http://192.168.18.131:5000/api'
// Render Backup: 'https://urbanease-backend-suham.onrender.com/api'

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'Bypass-Tunnel-Reminder': 'true',
    };
};

// Helper function for better error handling
const handleApiError = async (error, endpoint) => {
    console.error(`❌ API Error [${endpoint}]:`, error);

    // Auto-logout on 401 errors (invalid/expired token)
    if (error.message.includes('Not authorized') || error.message.includes('401')) {
        console.log('🔑 Token invalid - clearing authentication');
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        // The app will redirect to login automatically
    }

    if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
    }

    if (error.message.includes('timeout')) {
        throw new Error('Request timeout. Server is taking too long to respond.');
    }

    throw error;
};

// Global request helper to handle errors centralized
const request = async (endpoint, options = {}, retries = 3) => {
    try {
        const isFormData = options.body instanceof FormData;
        const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        });

        // Handle 401 Unauthorized globally
        if (response.status === 401) {
            console.log('🔑 Authentication failed (401) - Logging out...');
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            throw new Error('Not authorized');
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'API Request Failed');
            }
            return data;
        } else {
            // Handle non-JSON responses (Cloudflare 502 Bad Gateway or Local 404)
            const text = await response.text();
            console.error(`❌ Non-JSON Response [${response.status}]:`, text.substring(0, 200));

            if (text.startsWith('Bad Gateway') || response.status === 502) {
                if (retries > 0) {
                    const delay = (4 - retries) * 1000 * 2;
                    console.log(`♻️ Server overloaded (502). Retrying in ${delay / 1000}s... (${retries} left)`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return request(endpoint, options, retries - 1);
                }
                throw new Error('Server is warming up. Please wait a minute and pull to refresh.');
            }
            // Throw HTML content as error to see it on screen
            throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
        }
    } catch (error) {
        // If network request failed (e.g. timeout), also retry
        if (retries > 0 && (error.message.includes('Network request failed') || error.message.includes('timeout') || error.message.includes('busy'))) {
            const delay = (4 - retries) * 1000 * 2;
            console.log(`♻️ Network/Server error. Retrying in ${delay / 1000}s... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return request(endpoint, options, retries - 1);
        }
        return handleApiError(error, endpoint);
    }
};

export const api = {
    auth: {
        login: async (email, password) => {
            return request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
        },
        signup: async (userData) => {
            return request('/auth/signup', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
        },
        logout: async () => {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
        },
        sendOtp: async (email) => { // Send Registration OTP
            return request('/auth/send-otp', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
        },
        verifyOtp: async (email, otp) => { // Verify Registration OTP
            return request('/auth/verify-otp', {
                method: 'POST',
                body: JSON.stringify({ email, otp }),
            });
        },
        forgotPassword: async (email) => { // Send Reset OTP
            return request('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
        },
        verifyResetOtp: async (email, otp) => { // Verify Reset OTP (before setting pwd)
            return request('/auth/verify-reset-otp', {
                method: 'POST',
                body: JSON.stringify({ email, otp }),
            });
        },
        resetPassword: async (email, otp, newPassword) => { // Set new password
            return request('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ email, otp, newPassword }),
            });
        },
    },
    bills: {
        getAll: async () => {
            return request('/bills', { headers: await getHeaders() });
        },
        generate: async (type) => {
            // type: 'electricity', 'gas', 'maintenance'
            return request('/bills/generate', {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ type })
            });
        },
        pay: async (paymentData) => {
            // paymentData: { referenceId, paymentMethod, mobileNumber, amount }
            return request('/bills/pay', {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(paymentData)
            });
        }
    },
    complaints: {
        getAll: async () => {
            return request('/complaints', { headers: await getHeaders() });
        },
        create: async (complaintData) => {
            const headers = await getHeaders();
            // Remove Content-Type if FormData to let browser set boundary
            if (complaintData instanceof FormData) {
                delete headers['Content-Type'];
            }
            return request('/complaints', {
                method: 'POST',
                headers: headers,
                body: complaintData instanceof FormData ? complaintData : JSON.stringify(complaintData)
            });
        }
    },
    chat: {
        getMessages: async (userId) => {
            return request(`/chat/${userId}`, { headers: await getHeaders() });
        },
        getInbox: async () => {
            return request('/chat/inbox', { headers: await getHeaders() });
        },
        sendMessage: async (messageData) => {
            const headers = await getHeaders();
            let body = messageData;
            if (messageData instanceof FormData) {
                delete headers['Content-Type'];
                body = messageData;
            } else if (!(messageData instanceof FormData)) {
                // If simple object convert to body? No, request handles json stringify?
                // request helper expects body to be string or FormData?
                // request helper just passes body.
                if (!(messageData instanceof FormData)) {
                    body = JSON.stringify(messageData);
                }
            }
            // fix logic above:
            // The original logic checked instanceof FormData.

            return request('/chat', {
                method: 'POST',
                headers: headers,
                body: body
            });
        },
        deleteMessage: async (messageId) => {
            return request(`/chat/${messageId}`, {
                method: 'DELETE',
                headers: await getHeaders()
            });
        },
        getUnreadCounts: async () => {
            return request('/chat/unread', { headers: await getHeaders() });
        },
        markAsRead: async (chatId) => {
            return request(`/chat/read/${chatId}`, {
                method: 'POST',
                headers: await getHeaders()
            });
        }
    },
    notices: {
        getAll: async () => {
            return request('/notices', { headers: await getHeaders() });
        }
    },
    profile: {
        get: async () => {
            return request('/profile', { headers: await getHeaders() });
        },
        getById: async (id) => {
            return request(`/profile/${id}`, { headers: await getHeaders() });
        },
        update: async (profileData) => {
            return request('/profile', {
                method: 'PUT',
                headers: await getHeaders(),
                body: JSON.stringify(profileData)
            });
        }
    },
    // Helper for image URLs
    getImageUrl: (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        // Clean path to ensure no double slashes if path starts with /
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        // This base URL should match where your static files are served from
        // For render, it might be the same as BASE_URL's root.
        // If BASE_URL is .../api, we want the root.
        const rootUrl = BASE_URL.replace('/api', '');
        return `${rootUrl}/${cleanPath}`;
    }
};
