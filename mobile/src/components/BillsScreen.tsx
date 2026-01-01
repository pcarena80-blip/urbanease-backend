import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Modal, Image, Dimensions } from 'react-native';
import { ArrowLeft, CheckCircle, Smartphone, Zap, Flame, Wrench } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

export default function BillsScreen() {
  const navigation = useNavigation<any>();

  // State
  const [loading, setLoading] = useState(false);
  const [bill, setBill] = useState<any>(null); // Current active bill
  const [modalVisible, setModalVisible] = useState(false);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'JazzCash' | 'EasyPaisa' | ''>('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // 1. Generate/Fetch Bill for Service
  const handleServiceClick = async (type: 'electricity' | 'gas' | 'maintenance') => {
    setLoading(true);
    setBill(null);
    setPaymentSuccess(false);
    setPaymentMethod('');
    setMobileNumber('');

    try {
      const data = await api.bills.generate(type); // Backend Auto-Generates Reference ID
      setBill(data);
    } catch (error: any) {
      Alert.alert('Error', 'Could not fetch bill: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Process Payment
  const handlePayment = async () => {
    // Validation
    if (!paymentMethod) {
      Alert.alert('Select Method', 'Please choose JazzCash or EasyPaisa');
      return;
    }

    // Strict Phone Validation (03xxxxxxxxx)
    const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(mobileNumber)) {
      Alert.alert('Invalid Number', 'Number must be 11 digits and start with 03');
      return;
    }

    setPaying(true);
    try {
      const response = await api.bills.pay({
        referenceId: bill.referenceId, // Auto-fetched from bill
        amount: bill.amount,
        paymentMethod: paymentMethod,
        mobileNumber: mobileNumber
      });

      setTransactionId(response.transactionId);
      setPaymentSuccess(true);

      // Update local bill status
      setBill({ ...bill, status: 'paid' });

    } catch (error: any) {
      Alert.alert('Payment Failed', error.message);
    } finally {
      setPaying(false);
    }
  };

  // Close Modal & Reset
  const closeModal = () => {
    setModalVisible(false);
    setPaymentSuccess(false);
    setBill(null);
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
          <Text className="text-white text-2xl font-semibold">Pay Bills</Text>
        </View>
        <Text className="text-white/80 text-sm ml-10">Select a service to view and pay your bill</Text>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Service Cards */}
        <Text className="text-gray-900 font-bold text-lg mb-4">Services</Text>
        <View className="flex-row flex-wrap justify-between gap-y-4">

          {/* Electricity Card */}
          <TouchableOpacity
            onPress={() => handleServiceClick('electricity')}
            className="bg-white p-4 rounded-2xl shadow-sm items-center w-[48%]"
          >
            <View className="w-14 h-14 bg-yellow-100 rounded-full items-center justify-center mb-3">
              <Zap size={28} color="#F59E0B" fill="#F59E0B" />
            </View>
            <Text className="font-semibold text-gray-900">Electricity</Text>
            <Text className="text-xs text-gray-500 mt-1">IESCO</Text>
          </TouchableOpacity>

          {/* Gas Card */}
          <TouchableOpacity
            onPress={() => handleServiceClick('gas')}
            className="bg-white p-4 rounded-2xl shadow-sm items-center w-[48%]"
          >
            <View className="w-14 h-14 bg-blue-100 rounded-full items-center justify-center mb-3">
              <Flame size={28} color="#3B82F6" fill="#3B82F6" />
            </View>
            <Text className="font-semibold text-gray-900">Gas</Text>
            <Text className="text-xs text-gray-500 mt-1">SNGPL</Text>
          </TouchableOpacity>

          {/* Maintenance Card */}
          <TouchableOpacity
            onPress={() => handleServiceClick('maintenance')}
            className="bg-white p-4 rounded-2xl shadow-sm items-center w-[48%]"
          >
            <View className="w-14 h-14 bg-green-100 rounded-full items-center justify-center mb-3">
              <Wrench size={28} color="#10B981" />
            </View>
            <Text className="font-semibold text-gray-900">Maintenance</Text>
            <Text className="text-xs text-gray-500 mt-1">Society</Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {loading && <ActivityIndicator size="large" color="#027A4C" className="mt-10" />}

        {/* Bill Details Section (Appears after click) */}
        {bill && !loading && (
          <View className="mt-8 bg-white rounded-3xl p-6 shadow-md border border-gray-100">
            <View className="flex-row justify-between items-start mb-6">
              <View>
                <Text className="text-gray-500 text-xs uppercase tracking-wider font-bold">{bill.provider}</Text>
                <Text className="text-2xl font-bold text-gray-900 capitalize">{bill.billType} Bill</Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${bill.status === 'paid' ? 'bg-green-100' : 'bg-red-100'}`}>
                <Text className={`text-xs font-bold uppercase ${bill.status === 'paid' ? 'text-green-700' : 'text-red-700'}`}>
                  {bill.status}
                </Text>
              </View>
            </View>

            <View className="space-y-4 mb-6">
              <View className="flex-row justify-between border-b border-gray-100 pb-3">
                <Text className="text-gray-500">Bill ID</Text>
                <Text className="font-medium text-gray-900">{bill.billId}</Text>
              </View>

              {/* Type Specific Fields */}
              {bill.consumerId && (
                <View className="flex-row justify-between border-b border-gray-100 pb-3">
                  <Text className="text-gray-500">Consumer ID</Text>
                  <Text className="font-medium text-gray-900">{bill.consumerId}</Text>
                </View>
              )}
              {bill.flatNumber && (
                <View className="flex-row justify-between border-b border-gray-100 pb-3">
                  <Text className="text-gray-500">Flat No</Text>
                  <Text className="font-medium text-gray-900">{bill.flatNumber}</Text>
                </View>
              )}

              <View className="flex-row justify-between border-b border-gray-100 pb-3">
                <Text className="text-gray-500">Due Date</Text>
                <Text className="font-medium text-gray-900">{bill.dueDate}</Text>
              </View>

              {/* READ ONLY REFERENCE ID - HIGHLIGHTED */}
              <View className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <Text className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Payment Reference ID (Auto)</Text>
                <Text className="text-lg font-mono font-bold text-gray-800 tracking-wider">
                  {bill.referenceId}
                </Text>
              </View>

              <View className="flex-row justify-between pt-2 items-end">
                <Text className="text-gray-900 font-bold text-lg">Total Amount</Text>
                <Text className="text-[#027A4C] font-bold text-2xl">PKR {bill.amount.toLocaleString()}</Text>
              </View>
            </View>

            {/* Action Button */}
            {bill.status !== 'paid' ? (
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="bg-[#027A4C] py-4 rounded-xl items-center shadow-lg shadow-green-200"
              >
                <Text className="text-white font-bold text-lg">Pay Now</Text>
              </TouchableOpacity>
            ) : (
              <View className="bg-green-50 p-4 rounded-xl flex-row items-center justify-center gap-2">
                <CheckCircle size={24} color="#027A4C" />
                <Text className="text-green-800 font-bold text-lg">Paid Successfully</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-[32px] h-[65%] p-6">

            {/* Modal Header */}
            <View className="items-center mb-6">
              <View className="w-16 h-1 bg-gray-300 rounded-full mb-6" />
              {!paymentSuccess && <Text className="text-xl font-bold text-gray-900">Confirm Payment</Text>}
            </View>

            {paymentSuccess ? (
              // SUCCESS STATE
              <View className="flex-1 items-center justify-center -mt-10">
                <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
                  <CheckCircle size={40} color="#027A4C" />
                </View>
                <Text className="text-2xl font-bold text-[#027A4C] mb-2">Payment Successful!</Text>
                <Text className="text-gray-500 text-center mb-8 px-8">
                  Your payment of PKR {bill?.amount.toLocaleString()} for {bill?.billType} has been processed.
                </Text>

                <View className="bg-gray-50 w-full p-4 rounded-xl mb-8">
                  <Text className="text-xs text-gray-400 text-center uppercase mb-1">Transaction ID</Text>
                  <Text className="text-lg font-mono font-bold text-center text-gray-800">{transactionId}</Text>
                </View>

                <TouchableOpacity onPress={closeModal} className="bg-[#027A4C] w-full py-4 rounded-xl items-center">
                  <Text className="text-white font-bold text-lg">Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // PAYMENT FORM
              <ScrollView className="flex-1">
                {/* 1. Reference ID (Read Only) */}
                <Text className="text-gray-500 mb-2 font-medium">Reference ID</Text>
                <View className="bg-gray-100 p-4 rounded-xl mb-6">
                  <Text className="text-gray-800 font-bold text-base tracking-wide">{bill?.referenceId}</Text>
                </View>

                {/* 2. Select Method */}
                <Text className="text-gray-500 mb-3 font-medium">Select Payment Method</Text>
                <View className="flex-row gap-4 mb-6">
                  {/* JazzCash Option */}
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('JazzCash')}
                    className={`flex-1 p-4 rounded-xl border-2 items-center ${paymentMethod === 'JazzCash' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}
                  >
                    <Text className={`font-bold ${paymentMethod === 'JazzCash' ? 'text-red-500' : 'text-gray-600'}`}>JazzCash</Text>
                  </TouchableOpacity>

                  {/* EasyPaisa Option */}
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('EasyPaisa')}
                    className={`flex-1 p-4 rounded-xl border-2 items-center ${paymentMethod === 'EasyPaisa' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
                  >
                    <Text className={`font-bold ${paymentMethod === 'EasyPaisa' ? 'text-green-500' : 'text-gray-600'}`}>EasyPaisa</Text>
                  </TouchableOpacity>
                </View>

                {/* 3. Mobile Number */}
                <Text className="text-gray-500 mb-2 font-medium">Mobile Number</Text>
                <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-white mb-2 focus:border-[#027A4C]">
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
                <Text className="text-xs text-gray-400 mb-8 ml-1">Must be 11 digits (e.g. 03...)</Text>


                {/* Pay Button */}
                <TouchableOpacity
                  onPress={handlePayment}
                  disabled={paying}
                  className={`w-full py-4 rounded-xl items-center shadow-md ${paying ? 'bg-gray-400' : 'bg-[#027A4C]'}`}
                >
                  {paying ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Pay PKR {bill?.amount.toLocaleString()}</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setModalVisible(false)} className="py-4 items-center">
                  <Text className="text-gray-500 font-medium">Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}
