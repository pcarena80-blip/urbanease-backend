import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal, Alert } from 'react-native';
import { ArrowLeft, Receipt, CheckCircle } from 'lucide-react-native';

const payments = [
  { id: 1, month: 'October 2025', amount: 5000, date: 'Oct 28, 2025', refNo: 'TXN2025102801' },
  { id: 2, month: 'September 2025', amount: 5000, date: 'Sep 27, 2025', refNo: 'TXN2025092701' },
  { id: 3, month: 'August 2025', amount: 4800, date: 'Aug 29, 2025', refNo: 'TXN2025082901' },
  { id: 4, month: 'July 2025', amount: 4800, date: 'Jul 30, 2025', refNo: 'TXN2025073001' },
  { id: 5, month: 'June 2025', amount: 4800, date: 'Jun 28, 2025', refNo: 'TXN2025062801' },
];

export default function PaymentHistory({ onNavigate }: { onNavigate: (screen: string) => void }) {
  return (
    <View className="h-full flex flex-col bg-gray-50">
      <View className="p-6" style={{
        backgroundColor: '#00c878'
      }}>
        <TouchableOpacity onPress={() => onNavigate('bills')} className="text-white mb-4">
          <ArrowLeft className="w-6 h-6" />
        </TouchableOpacity>
        <Text className="text-white mb-2">Payment History</Text>
        <Text className="text-white/90">All your past payments</Text>
      </View>

      <View className="flex-1 overflow-y-auto px-6 py-6 pb-8 space-y-4">
        {payments.map((payment) => (
          <View key={payment.id} className="bg-white rounded-3xl p-5 shadow-sm">
            <View className="flex items-start justify-between mb-4">
              <View className="flex items-center gap-3">
                <View className="w-12 h-12 rounded-2xl bg-[#00c878]/10 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-[#00c878]" />
                </View>
                <View>
                  <Text className="text-gray-900 mb-1">{payment.month}</Text>
                  <Text className="text-gray-500">Paid on {payment.date}</Text>
                </View>
              </View>
              <CheckCircle className="w-6 h-6 text-[#00c878]" />
            </View>

            <View className="space-y-2 pt-4 border-t border-gray-100">
              <View className="flex items-center justify-between">
                <Text className="text-gray-600">Amount</Text>
                <Text className="text-gray-900">PKR {payment.amount.toLocaleString()}</Text>
              </View>
              <View className="flex items-center justify-between">
                <Text className="text-gray-600">Reference No.</Text>
                <Text className="text-gray-500">{payment.refNo}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}




