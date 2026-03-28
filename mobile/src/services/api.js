
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_API_BASE_URL = 'https://urbanease-api.duckdns.org/api';
const configuredBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();

const normalizeBaseUrl = (url) => {
    if (!url) return DEFAULT_API_BASE_URL;
    const trimmed = url.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const BASE_URL = normalizeBaseUrl(configuredBaseUrl || DEFAULT_API_BASE_URL);
export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

console.log('🌐 API BASE_URL:', BASE_URL);

let cachedToken = null;
let onUnauthorizedCallback = null;
const NOTIFICATION_SEEN_KEY = 'seenNotifications';

const getHeaders = async () => {
    if (!cachedToken) {
        cachedToken = await AsyncStorage.getItem('token');
    }
    
    return {
        'Content-Type': 'application/json',
        'Authorization': cachedToken ? `Bearer ${cachedToken}` : '',
        'Bypass-Tunnel-Reminder': 'true',
    };
};

export const updateApiToken = (newToken) => {
    cachedToken = newToken;
};

export const setOnUnauthorized = (callback) => {
    onUnauthorizedCallback = callback;
};

const handleApiError = async (error, endpoint) => {
    console.error(`❌ API Error [${endpoint}]:`, error);

    if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
    }

    if (error.message.includes('timeout')) {
        throw new Error('Request timeout. Server is slow.');
    }

    throw error;
};

const request = async (endpoint, options = {}, retries = 3) => {
    try {
        const isFormData = options.body instanceof FormData;
        const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };

        const finalHeaders = {
            ...defaultHeaders,
            ...options.headers,
        };

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: finalHeaders,
        });

        if (response.status === 401) {
            console.log('🔑 401 Unauthorized detected');
            if (onUnauthorizedCallback) {
                onUnauthorizedCallback();
            }
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
            const text = await response.text();
            if (response.status === 502 || text.includes('Bad Gateway')) {
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return request(endpoint, options, retries - 1);
                }
            }
            throw new Error(`Server Error (${response.status})`);
        }
    } catch (error) {
        if (retries > 0 && (error.message.includes('Network request failed') || error.message.includes('timeout'))) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return request(endpoint, options, retries - 1);
        }
        return handleApiError(error, endpoint);
    }
};

export const api = {
    auth: {
        submitLoginCredentials: async (email, password) => {
            const data = await request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            if (data.token) cachedToken = data.token;
            return data;
        },
        submitSignUpForm: async (userData) => {
            const data = await request('/auth/signup', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
            if (data.token) cachedToken = data.token;
            return data;
        },
        logout: async () => {
            cachedToken = null;
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
        },
        getProfile: async () => {
            return request('/auth/profile', { headers: await getHeaders() });
        },
        sendOtp: async (email) => {
            return request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) });
        },
        verifyOtp: async (email, otp) => {
            return request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });
        },
        searchUsers: async (query) => {
            return request(`/auth/users?search=${query}`, { headers: await getHeaders() });
        }
    },
    profile: {
        requestEditProfileForm: async () => {
            return request('/profile', { headers: await getHeaders() });
        },
        submitProfileChanges: async (profileData) => {
            return request('/profile', {
                method: 'PUT',
                headers: await getHeaders(),
                body: JSON.stringify(profileData)
            });
        }
    },
    notices: {
        requestNoticesScreen: async () => {
            return request('/notices', { headers: await getHeaders() });
        }
    },
    notifications: {
        getSeenIds: async () => {
            const raw = await AsyncStorage.getItem(NOTIFICATION_SEEN_KEY);
            if (!raw) return [];

            try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                return [];
            }
        },
        markAllSeen: async (notificationIds = []) => {
            if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
                return [];
            }

            const existingIds = await api.notifications.getSeenIds();
            const mergedIds = Array.from(new Set([...existingIds, ...notificationIds]));
            await AsyncStorage.setItem(NOTIFICATION_SEEN_KEY, JSON.stringify(mergedIds));
            return mergedIds;
        },
        // Aggregate notifications from all real sources in parallel
        getAll: async () => {
            const results = await Promise.allSettled([
                request('/notices', { headers: await getHeaders() }),
                request('/bills', { headers: await getHeaders() }),
                request('/complaints', { headers: await getHeaders() }),
            ]);
            const seenIds = new Set(await api.notifications.getSeenIds());

            const [noticesRes, billsRes, complaintsRes] = results;
            const unified = [];

            // Notices → notification items
            if (noticesRes.status === 'fulfilled' && Array.isArray(noticesRes.value)) {
                noticesRes.value.forEach(n => {
                    unified.push({
                        id: `notice-${n._id}`,
                        type: 'notice',
                        title: n.title,
                        description: n.description,
                        time: n.createdAt,
                        read: false,
                        raw: n,
                    });
                });
            }

            // Bills → notify if status is 'due'
            if (billsRes.status === 'fulfilled' && Array.isArray(billsRes.value)) {
                billsRes.value
                    .filter(b => b.status === 'due')
                    .forEach(b => {
                        unified.push({
                            id: `bill-${b._id}`,
                            type: 'bill',
                            title: `${b.type?.charAt(0).toUpperCase() + b.type?.slice(1)} Bill Due`,
                            description: `Rs. ${b.amount?.toLocaleString()} due on ${b.dueDate} — ${b.provider}`,
                            time: b.createdAt,
                            read: false,
                            raw: b,
                        });
                    });
            }

            // Complaints → notify when resolved, in-progress, or rejected
            if (complaintsRes.status === 'fulfilled' && Array.isArray(complaintsRes.value)) {
                complaintsRes.value
                    .filter(c => c.status !== 'pending')
                    .forEach(c => {
                        const statusLabel = {
                            'in-progress': 'In Progress',
                            'resolved': 'Resolved',
                            'rejected': 'Rejected',
                        }[c.status] || c.status;
                        unified.push({
                            id: `complaint-${c._id}`,
                            type: 'complaint',
                            title: `Complaint ${statusLabel}`,
                            description: `"${c.subject}" — ${c.response || 'Admin has reviewed your complaint.'}`,
                            time: c.updatedAt || c.createdAt,
                            read: c.status === 'resolved',
                            raw: c,
                        });
                    });
            }

            // Sort by most recent first
            unified.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
            return unified.map((item) => ({
                ...item,
                read: item.read || seenIds.has(item.id),
            }));
        },
    },
    bills: {
        getAll: async () => {
            return request('/bills', { headers: await getHeaders() });
        },
        pay: async (billOrPaymentData, maybePaymentData) => {
            const billId =
                typeof billOrPaymentData === 'string'
                    ? billOrPaymentData
                    : billOrPaymentData?.billId || billOrPaymentData?._id;

            const payload =
                typeof billOrPaymentData === 'string'
                    ? maybePaymentData
                    : billId
                        ? { ...billOrPaymentData, billId: undefined, _id: undefined }
                        : billOrPaymentData;

            if (billId) {
                return request(`/bills/${billId}`, {
                    method: 'PUT',
                    headers: await getHeaders(),
                    body: JSON.stringify(payload)
                });
            }

            return request('/bills/pay', {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(payload)
            });
        }
    },
    complaints: {
        requestComplaintModule: async () => {
            return request('/complaints', { headers: await getHeaders() });
        },
        submitComplaint: async (complaintData) => {
            const headers = await getHeaders();
            if (complaintData instanceof FormData) delete headers['Content-Type'];
            return request('/complaints', {
                method: 'POST',
                headers: headers,
                body: complaintData instanceof FormData ? complaintData : JSON.stringify(complaintData)
            });
        }
    },
    carpool: {
        getAll: async () => {
            return request('/carpool', { headers: await getHeaders() });
        },
        create: async (payload) => {
            return request('/carpool', {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(payload)
            });
        },
        delete: async (id) => {
            return request(`/carpool/${id}`, { method: 'DELETE', headers: await getHeaders() });
        },
        report: async (id, reason) => {
            return request(`/carpool/${id}/report`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ reason })
            });
        }
    },
    chat: {
        getInbox: async () => {
            return request('/chat/inbox', { headers: await getHeaders() });
        },
        displayChatWindow: async (userId) => {
            return request(`/chat/${userId}`, { headers: await getHeaders() });
        },
        sendMessage: async (messageData) => {
            const headers = await getHeaders();
            if (messageData instanceof FormData) {
                delete headers['Content-Type'];
                return request('/chat', { method: 'POST', headers: headers, body: messageData });
            }
            return request('/chat', { method: 'POST', headers: headers, body: JSON.stringify(messageData) });
        },
        markAsRead: async (chatId) => {
            return request(`/chat/read/${chatId}`, { method: 'POST', headers: await getHeaders() });
        },
        requestChatCenter: async () => {
            return request('/chat/unread', { headers: await getHeaders() });
        },
        reportMessage: async (messageId, reason) => {
            return request('/chat/report', {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ messageId, reason })
            });
        },
        sendRequest: async (receiverId) => {
            return request('/chat/request', {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ receiverId })
            });
        },
        getRequests: async () => {
            return request('/chat/requests', { headers: await getHeaders() });
        },
        respondToRequest: async (requestId, status) => {
            return request(`/chat/request/${requestId}`, {
                method: 'PUT',
                headers: await getHeaders(),
                body: JSON.stringify({ status })
            });
        },
        getChatStatus: async (userId) => {
            return request(`/chat/status/${userId}`, { headers: await getHeaders() });
        },
        deleteMessage: async (messageId) => {
            return request(`/chat/${messageId}`, { method: 'DELETE', headers: await getHeaders() });
        },
        deleteConnection: async (userId) => {
            return request(`/chat/connection/${userId}`, { method: 'DELETE', headers: await getHeaders() });
        }
    },
    getImageUrl: (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const cleanPath = path.replace(/\\/g, '/').startsWith('/') ? path.substring(1) : path;
        return `${API_ORIGIN}/${cleanPath.replace(/\\/g, '/')}`;
    }
};
