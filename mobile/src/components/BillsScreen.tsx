import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Modal, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, CheckCircle, Smartphone, Zap, Flame, Wrench, FileText, Download, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';

export default function BillsScreen() {
  const navigation = useNavigation<any>();

  // State
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any>(null); // For Payment Modal
  const [refreshing, setRefreshing] = useState(false);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'JazzCash' | 'EasyPaisa' | ''>('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Fetch Bills from Backend
  const fetchBills = async () => {
    try {
      const data = await api.bills.getAll();
      setBills(data);
    } catch (error: any) {
      if (!error.message.includes('404')) { // Don't alert on empty list
        console.error(error);
        Alert.alert('Error', 'Could not load bills. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload data when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchBills();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBills();
  };

  // Open Payment Modal
  const openPaymentModal = (bill: any) => {
    setSelectedBill(bill);
    setPaymentSuccess(false);
    setPaymentMethod('');
    setMobileNumber('');
    setTransactionId('');
  };

  // Process Payment
  const handlePayment = async () => {
    if (!paymentMethod) return Alert.alert('Select Method', 'Please choose JazzCash or EasyPaisa');

    // Strict Phone Validation (03xxxxxxxxx)
    const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(mobileNumber)) {
      return Alert.alert('Invalid Number', 'Number must be 11 digits and start with 03');
    }

    setPaying(true);
    try {
      const response = await api.bills.pay({
        referenceId: selectedBill.referenceId,
        amount: selectedBill.amount,
        paymentMethod: paymentMethod,
        mobileNumber: mobileNumber
      });

      setTransactionId(response.transactionId);
      setPaymentSuccess(true);

      // Update local list instantly
      setBills(currentBills =>
        currentBills.map(b => b._id === selectedBill._id ? { ...b, status: 'paid' } : b)
      );

    } catch (error: any) {
      Alert.alert('Payment Failed', error.message);
    } finally {
      setPaying(false);
    }
  };

  const closeModal = () => {
    setSelectedBill(null);
    setPaymentSuccess(false);
  };

  // Icons Helper
  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('electricity')) return <Zap size={24} color="#F59E0B" fill="#F59E0B" />;
    if (t.includes('gas')) return <Flame size={24} color="#3B82F6" fill="#3B82F6" />;
    return <Wrench size={24} color="#10B981" />;
  };

  const getStatusColor = (status: string) => {
    return status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  return (
    <View className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#003E2F', '#005C3C', '#027A4C']}
        className="px-6 pt-12 pb-8 rounded-b-[32px] shadow-lg"
      >
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="white" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-semibold">My Bills</Text>
        </View>
        <Text className="text-white/80 text-sm ml-10">Manage and pay your monthly utility bills</Text>
      </LinearGradient>

      {/* Main List */}
      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {loading ? (
          <ActivityIndicator size="large" color="#027A4C" className="mt-10" />
        ) : bills.length === 0 ? (
          <View className="items-center justify-center mt-20">
            <View className="bg-gray-100 p-6 rounded-full mb-4">
              <FileText size={40} color="#9CA3AF" />
            </View>
            <Text className="text-gray-500 font-medium">No bills found yet.</Text>
            <Text className="text-gray-400 text-sm mt-1 text-center px-10">Wait for the admin to dispatch monthly bills.</Text>
          </View>
        ) : (
          <View className="gap-y-4">
            {bills.map((bill) => (
              <View key={bill._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">

                {/* Bill Header */}
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row items-center gap-3">
                    <View className={`w-12 h-12 rounded-full items-center justify-center ${bill.type.includes('electricity') ? 'bg-yellow-50' : bill.type.includes('gas') ? 'bg-blue-50' : 'bg-green-50'}`}>
                      {getIcon(bill.type)}
                    </View>
                    <View>
                      <Text className="font-bold text-gray-900 capitalize text-lg">{bill.type} Bill</Text>
                      <Text className="text-gray-500 text-xs uppercase font-medium">{bill.billingMonth}</Text>
                    </View>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${bill.status === 'paid' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text className={`text-xs font-bold uppercase ${bill.status === 'paid' ? 'text-green-700' : 'text-red-700'}`}>
                      {bill.status}
                    </Text>
                  </View>
                </View>

                {/* Bill Details */}
                <View className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500 text-sm">Amount</Text>
                    <Text className="font-bold text-gray-900 text-base">PKR {bill.amount.toLocaleString()}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500 text-sm">Due Date</Text>
                    <Text className="font-medium text-gray-800 text-sm">{bill.dueDate}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500 text-sm">Ref ID</Text>
                    <Text className="font-mono text-gray-600 text-xs">{bill.referenceId}</Text>
                  </View>
                </View>

                {/* Footer Action */}
                {bill.status !== 'paid' ? (
                  <TouchableOpacity
                    onPress={() => openPaymentModal(bill)}
                    className="bg-[#027A4C] py-3 rounded-xl items-center flex-row justify-center gap-2"
                  >
                    <Text className="text-white font-bold">Pay Now</Text>
                  </TouchableOpacity>
                ) : (
                  <View className="flex-row items-center justify-center gap-2 opacity-60">
                    <CheckCircle size={16} color="#027A4C" />
                    <Text className="text-green-800 font-medium text-sm">Paid on {new Date(bill.paidDate).toLocaleDateString()}</Text>
                  </View>
                )}

              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedBill}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View className="flex-1 justify-end bg-black/60">
            <View className="bg-white rounded-t-[32px] h-[85%] p-6">

              <View className="items-center mb-2">
                <View className="w-16 h-1 bg-gray-300 rounded-full mb-6" />
              </View>

              {paymentSuccess ? (
                // SUCCESS View
                <View className="flex-1 items-center justify-center px-4">
                  <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
                    <CheckCircle size={40} color="#027A4C" />
                  </View>
                  <Text className="text-2xl font-bold text-[#027A4C] mb-2">Payment Successful!</Text>
                  <Text className="text-gray-500 text-center mb-8">
                    Ref ID: {selectedBill?.referenceId}{'\n'}
                    Transaction ID: {transactionId}
                  </Text>
                  <TouchableOpacity onPress={closeModal} className="bg-[#027A4C] w-full py-4 rounded-xl items-center">
                    <Text className="text-white font-bold text-lg">Done</Text>
                  </TouchableOpacity>
                </View>
              ) : selectedBill && (
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                  <Text className="text-2xl font-bold text-gray-900 mb-1 capitalize text-center">{selectedBill.type} Bill</Text>
                  <Text className="text-gray-500 text-center mb-6">{selectedBill.billingMonth}</Text>

                  {/* Download Bill Option */}
                  <TouchableOpacity className="flex-row items-center justify-center gap-2 bg-blue-50 py-3 rounded-xl border border-blue-100 mb-8">
                    <Download size={20} color="#2563EB" />
                    <Text className="text-blue-700 font-semibold">Download Bill PDF</Text>
                  </TouchableOpacity>

                  {/* Details */}
                  <View className="bg-gray-50 p-5 rounded-2xl mb-6 space-y-4">
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500">Consumer Name</Text>
                      <Text className="font-semibold text-gray-900">{selectedBill.consumerName}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500">Bill ID</Text>
                      <Text className="font-semibold text-gray-900">{selectedBill.billId}</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-500">Reference ID</Text>
                      <Text className="font-mono font-bold text-gray-800 bg-white px-2 py-1 rounded border border-gray-200">{selectedBill.referenceId}</Text>
                    </View>
                    <View className="h-[1px] bg-gray-200 my-2" />
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-900 font-bold text-lg">Total Amount</Text>
                      <Text className="text-[#027A4C] font-bold text-2xl">PKR {selectedBill.amount.toLocaleString()}</Text>
                    </View>
                  </View>

                  {/* Payment Form */}
                  <Text className="font-bold text-gray-900 mb-3 text-lg">Payment Details</Text>

                  <Text className="text-gray-500 mb-2 font-medium text-sm">Select Method</Text>
                  <View className="flex-row gap-4 mb-6">
                    <TouchableOpacity
                      onPress={() => setPaymentMethod('JazzCash')}
                      className={`flex-1 p-4 rounded-xl border-2 items-center ${paymentMethod === 'JazzCash' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}
                    >
                      <Text className={`font-bold ${paymentMethod === 'JazzCash' ? 'text-red-500' : 'text-gray-600'}`}>JazzCash</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setPaymentMethod('EasyPaisa')}
                      className={`flex-1 p-4 rounded-xl border-2 items-center ${paymentMethod === 'EasyPaisa' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
                    >
                      <Text className={`font-bold ${paymentMethod === 'EasyPaisa' ? 'text-green-500' : 'text-gray-600'}`}>EasyPaisa</Text>
                    </TouchableOpacity>
                  </View>

                  <Text className="text-gray-500 mb-2 font-medium text-sm">Mobile Number</Text>
                  <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-white mb-8 focus:border-[#027A4C]">
                    <Smartphone size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-lg text-gray-900"
                      placeholder="03001234567"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      maxLength={11}
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handlePayment}
                    disabled={paying}
                    className={`w-full py-4 rounded-xl items-center shadow-lg ${paying ? 'bg-gray-400' : 'bg-[#027A4C]'}`}
                  >
                    {paying ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Confirm Payment</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={closeModal} className="py-4 items-center mb-4">
                    <Text className="text-gray-500 font-medium">Cancel</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}
