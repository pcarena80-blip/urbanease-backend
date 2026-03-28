import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ArrowLeft, Bell, FileText, Receipt, ClipboardList, CheckCircle, AlertCircle, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

// ─── Icon + colour config per notification type ───────────────────────────────
const TYPE_CONFIG: Record<string, { Icon: any; bg: string; color: string; label: string }> = {
  notice: {
    Icon: FileText,
    bg: '#F1F8F4',
    color: '#027A4C',
    label: 'Notice',
  },
  bill: {
    Icon: Receipt,
    bg: '#FFF3E0',
    color: '#E65100',
    label: 'Bill',
  },
  complaint: {
    Icon: ClipboardList,
    bg: '#FFF8E1',
    color: '#F57F17',
    label: 'Complaint',
  },
};

const STATUS_ICON: Record<string, { Icon: any; color: string }> = {
  resolved: { Icon: CheckCircle, color: '#027A4C' },
  'in-progress': { Icon: Clock, color: '#F57F17' },
  rejected: { Icon: AlertCircle, color: '#F44336' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr.split('T')[0] || '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      const data = await api.notifications.getAll();
      setNotifications(data);

      const unreadIds = data
        .filter((item: any) => !item.read)
        .map((item: any) => item.id);

      if (unreadIds.length > 0) {
        await api.notifications.markAllSeen(unreadIds);
        setNotifications(
          data.map((item: any) => ({
            ...item,
            read: true,
          })),
        );
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View className="h-full bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#003E2F', '#027A4C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-6 pt-12 pb-5 rounded-b-[32px]"
      >
        <View className="flex-row items-center gap-4 mb-1">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
            <ArrowLeft size={24} color="white" strokeWidth={1.5} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-lg font-semibold">Notifications</Text>
            {unreadCount > 0 && (
              <Text className="text-white/70 text-xs">{unreadCount} unread</Text>
            )}
          </View>
          <View className="w-9 h-9 rounded-xl bg-white/15 items-center justify-center">
            <Bell size={18} color="white" strokeWidth={1.5} />
          </View>
        </View>
      </LinearGradient>

      {/* Body */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#027A4C" />
          <Text className="text-gray-400 mt-3 text-sm">Loading notifications…</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <AlertCircle size={40} color="#F44336" strokeWidth={1.5} />
          <Text className="text-gray-700 font-medium mt-3 text-center">{error}</Text>
          <TouchableOpacity
            onPress={() => loadNotifications()}
            className="mt-4 px-6 py-2.5 bg-[#027A4C] rounded-xl"
          >
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 28 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
              colors={['#027A4C']}
              tintColor="#027A4C"
            />
          }
        >
          {notifications.length === 0 ? (
            <View className="flex-1 items-center justify-center mt-20">
              <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Bell size={36} color="#CBD5E1" strokeWidth={1.5} />
              </View>
              <Text className="text-gray-500 font-medium text-base">All caught up!</Text>
              <Text className="text-gray-400 text-sm mt-1">No notifications right now.</Text>
            </View>
          ) : (
            notifications.map((item) => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.notice;
              const { Icon, bg, color } = cfg;
              return (
                <View
                  key={item.id}
                  className={`bg-white rounded-2xl p-4 mb-3 shadow-sm ${
                    !item.read ? 'border-l-4' : ''
                  }`}
                  style={!item.read ? { borderLeftColor: color } : {}}
                >
                  <View className="flex-row gap-3">
                    {/* Icon circle */}
                    <View
                      className="w-12 h-12 rounded-2xl items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: bg }}
                    >
                      <Icon size={22} color={color} strokeWidth={1.5} />
                    </View>

                    {/* Content */}
                    <View className="flex-1">
                      <View className="flex-row justify-between items-start mb-0.5">
                        <View className="flex-row items-center gap-1.5 flex-1 mr-2">
                          <Text
                            className={`text-gray-900 text-[14px] flex-1 ${!item.read ? 'font-semibold' : 'font-medium'}`}
                            numberOfLines={2}
                          >
                            {item.title}
                          </Text>
                        </View>
                        <Text className="text-gray-400 text-[11px] flex-shrink-0">
                          {timeAgo(item.time)}
                        </Text>
                      </View>

                      <Text className="text-gray-500 text-[12.5px] leading-relaxed" numberOfLines={3}>
                        {item.description}
                      </Text>

                      {/* Tag pill */}
                      <View className="mt-2 flex-row items-center gap-2">
                        <View
                          className="px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: bg }}
                        >
                          <Text style={{ color, fontSize: 10, fontWeight: '600' }}>
                            {cfg.label}
                          </Text>
                        </View>
                        {!item.read && (
                          <View className="w-2 h-2 rounded-full bg-[#027A4C]" />
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
