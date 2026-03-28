import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal, Alert, KeyboardAvoidingView } from 'react-native';
import {
  Building2,
  User,
  Mail,
  CreditCard,
  Phone,
  Lock,
  CheckCircle,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  X,
  FileText,
  Shield
} from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import StatusModal from './common/StatusModal';

// Terms and Conditions content
const TERMS_CONTENT = `UrbanEase - Terms & Conditions
Last Updated: 14th January 2026

1. Acceptance of Terms
By registering, accessing, or using the Smart Society Management System ("App"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the App.

2. Purpose of the App
This App is designed to manage residential society operations including, but not limited to:
• Resident registration and verification
• Complaints and notices
• Society announcements
• Records management
• Communication between residents and administration

3. User Eligibility
• Users must provide accurate and valid information during registration.
• Providing fake, misleading, or incomplete information is strictly prohibited.
• Each user is responsible for maintaining the confidentiality of their account credentials.

4. User Responsibilities
Users agree to:
• Use the App only for lawful society-related purposes
• Not misuse complaints, notices, or messaging features
• Not upload false, abusive, offensive, or harmful content
• Follow all society rules and regulations

5. Account Usage
• Each user may maintain only one account.
• Sharing accounts is not permitted.
• The administration reserves the right to suspend or terminate accounts involved in suspicious or fraudulent activities.

6. Prohibited Activities
Users must not:
• Use abusive or inappropriate language
• Submit fake complaints or spam content
• Attempt to access unauthorized data or accounts
• Interfere with the App's security or functionality

7. Account Suspension or Termination
The App administration reserves the right to:
• Temporarily suspend or permanently terminate any account
• Take action without prior notice if rules are violated

8. Modification of Services
We reserve the right to:
• Modify, update, or discontinue any feature of the App
• Update these Terms & Conditions at any time
• Continued use of the App after changes means acceptance of the updated terms.

9. Limitation of Liability
The App is provided "as is". We are not responsible for:
• Any indirect or incidental damages
• Loss of data due to user negligence or technical issues

10. Governing Law
These Terms & Conditions shall be governed by the laws of Pakistan.`;

// Privacy Policy content
const PRIVACY_CONTENT = `UrbanEase - Privacy Policy
Smart Society Management System
Last Updated: 14th January 2026

1. Introduction
Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our App.

2. Information We Collect
We may collect the following information:
• Full Name
• CNIC Number
• Phone Number
• House / Flat Number
• Vehicle Information
• Login and usage data

3. Purpose of Data Collection
Your data is collected strictly for:
• Resident verification
• Society management and record keeping
• Handling complaints and notices
• Communication between residents and management

We do not sell or share your personal data with third parties.

4. CNIC Data Protection
• CNIC information is treated as highly confidential
• CNIC data is used only for verification and legal purposes
• CNIC numbers are not publicly visible to other users

5. Data Security
We implement appropriate security measures to:
• Protect data from unauthorized access
• Prevent misuse, loss, or alteration of information
• However, no digital system is 100% secure.

6. Data Retention
User data is retained only as long as necessary for:
• Society operations
• Legal and administrative purposes

7. User Rights
Users have the right to:
• Access their personal data
• Request corrections
• Request account deletion (subject to society policies)

8. Third-Party Services
The App may use trusted third-party services (e.g., hosting or analytics) that follow strict data protection standards.

9. Changes to Privacy Policy
We may update this Privacy Policy from time to time. Any changes will be posted within the App or on the website.

10. Contact Information
For any questions regarding these Terms or Privacy Policy, please contact the Society Office.`;

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    cnic: "",
    phone: "",
    propertyType: "house",
    ownership: "owner",
    block: "",
    street: "",
    houseNo: "",
    plazaName: "",
    floorNumber: "",
    flatNumber: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  // Verification States
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [timer, setTimer] = useState(60); // OTP Timer state
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // OTP Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOtpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpSent, timer]);

  // Terms and Privacy Modal States
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState({ visible: false, type: 'success' as 'success' | 'error', title: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validationAlertLockRef = useRef(false);

  const normalizeEmail = (email: string) => email.trim().toLowerCase();

  const validateField = (name: string, value: string, currentFormData = formData) => {
    let error = "";
    if (name === "fullName" && !value.trim()) error = "Full Name is required";
    if (name === "email") {
      if (!value) error = "Email is required";
      else if (!/^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|yahoo\.com|hotmail\.com|icloud\.com)$/.test(value.toLowerCase())) {
        error = "Use a valid email (gmail, outlook, etc.)";
      }
    }
    if (name === "cnic") {
      const digits = value.replace(/\D/g, '');
      if (!value) error = "CNIC is required";
      else if (digits.length < 13) error = "CNIC must be 13 digits";
    }
    if (name === "phone") {
      const phoneDigits = value.replace(/\D/g, '');
      if (!value || phoneDigits.length < 12) error = "Phone must be +92 followed by 10 digits";
    }
    if (name === "password") {
      if (!value) error = "Password is required";
      else if (value.length < 8) error = "Must be at least 8 characters";
      else if (!/(?=.*[A-Z])/.test(value)) error = "Uppercase letter missing";
      else if (!/(?=.*[a-z])/.test(value)) error = "Lowercase letter missing";
      else if (!/(?=.*\d)/.test(value)) error = "Number missing";
      else if (!/(?=.*[@$!%*?&])/.test(value)) error = "Special character missing";
    }
    if (name === "confirmPassword") {
      if (value !== currentFormData.password) error = "Passwords do not match";
    }
    if (name === "block" && currentFormData.propertyType === "house" && !value) error = "Required";
    if (name === "street" && currentFormData.propertyType === "house" && !value) error = "Required";
    if (name === "houseNo" && currentFormData.propertyType === "house" && !value) error = "Required";
    if (name === "plazaName" && currentFormData.propertyType === "apartment" && !value) error = "Required";
    if (name === "floorNumber" && currentFormData.propertyType === "apartment" && !value) error = "Required";
    if (name === "flatNumber" && currentFormData.propertyType === "apartment" && !value) error = "Required";

    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleFieldChange = (name: string, value: string) => {
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    validateField(name, value, newFormData);
  };

  const resetEmailVerificationState = () => {
    setIsEmailVerified(false);
    setVerifiedEmail("");
    setRegistrationToken("");
    setIsOtpSent(false);
    setOtp("");
    setTimer(60);
  };

  const handleEmailChange = (text: string) => {
    const nextEmail = text;
    setFormData(prev => ({ ...prev, email: nextEmail }));
    if (normalizeEmail(nextEmail) !== verifiedEmail) {
      resetEmailVerificationState();
    }
  };



  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleModalClose = () => {
    setModal(prev => ({ ...prev, visible: false }));
    if (modal.type === 'success') {
      navigation.navigate('Login');
    }
  };

  const showValidationAlert = (title: string, message: string) => {
    if (validationAlertLockRef.current) return;
    validationAlertLockRef.current = true;
    Alert.alert(title, message, [
      {
        text: 'OK',
        onPress: () => {
          validationAlertLockRef.current = false;
        }
      }
    ]);
  };

  // Phone number handler - Fixed +92 prefix with exactly 10 digits
  // Display format: +92 301-0816789
  const handlePhoneChange = (text: string) => {
    // Remove all non-digit characters
    const digitsOnly = text.replace(/\D/g, '');

    // If user somehow removed the 92 prefix, don't update
    if (text.length < 3 && !text.startsWith('+92')) {
      setFormData({ ...formData, phone: '+92' });
      return;
    }

    // Extract digits after +92 (max 10 digits)
    let phoneDigits = digitsOnly;
    if (digitsOnly.startsWith('92')) {
      phoneDigits = digitsOnly.substring(2);
    }

    // Limit to 10 digits after +92
    phoneDigits = phoneDigits.substring(0, 10);

    // Format as +92 301-0816789 (space after code, dash after 3rd digit)
    let formatted = '+92';
    if (phoneDigits.length > 0) {
      formatted += ' ' + phoneDigits.substring(0, 3);
      if (phoneDigits.length > 3) {
        formatted += '-' + phoneDigits.substring(3);
      }
    }

    setFormData({ ...formData, phone: formatted });
  };

  // Validate phone number - must be exactly +92 followed by 10 digits
  const validatePhone = () => {
    // Remove formatting for validation
    const phoneDigits = formData.phone.replace(/\D/g, '');
    return phoneDigits.length === 12; // 92 + 10 digits
  };

  const handleSendOtp = async () => {
    if (otpLoading) return;

    const normalizedEmail = normalizeEmail(formData.email);
    const fullName = formData.fullName.trim();

    if (!fullName) {
      showValidationAlert('Error', 'Please enter your full name first');
      validateField('fullName', fullName);
      return;
    }

    if (!normalizedEmail) {
      showValidationAlert('Error', 'Please enter email address');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|yahoo\.com|hotmail\.com|icloud\.com)$/;
    if (!emailRegex.test(normalizedEmail)) {
      showValidationAlert('Error', 'Please use a valid email address (gmail.com, outlook.com, etc.)');
      return;
    }

    setOtpLoading(true);
    try {
      setFormData(prev => ({ ...prev, email: normalizedEmail }));
      await api.auth.sendOtp(normalizedEmail);
      setIsOtpSent(true);
      setTimer(60); // Start 60s timer
      Alert.alert('Success', 'OTP sent to your email');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpLoading) return;

    const normalizedEmail = normalizeEmail(formData.email);

    if (!otp || otp.length < 6) {
      showValidationAlert('Error', 'Enter valid 6-digit OTP');
      return;
    }
    if (timer === 0) {
      showValidationAlert('Error', 'OTP has expired. Please tap Resend to get a new code.');
      return;
    }
    setOtpLoading(true);
    try {
      const response = await api.auth.verifyOtp(normalizedEmail, otp.trim());
      setFormData(prev => ({ ...prev, email: normalizedEmail }));
      setIsEmailVerified(true);
      setVerifiedEmail(normalizedEmail);
      setRegistrationToken(response?.registrationToken || "");
      setIsOtpSent(false);
      if (countdownRef.current) clearInterval(countdownRef.current);
      Alert.alert('Success', 'Email Verified Successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid or expired OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    const normalizedEmail = normalizeEmail(formData.email);

    if (!isEmailVerified || verifiedEmail !== normalizedEmail) {
      showValidationAlert('Error', 'Please verify your email first');
      return;
    }

    // Run validation on all fields
    const keysToValidate = ['fullName', 'cnic', 'phone', 'password', 'confirmPassword'];
    if (formData.propertyType === 'house') {
      keysToValidate.push('block', 'street', 'houseNo');
    } else {
      keysToValidate.push('plazaName', 'floorNumber', 'flatNumber');
    }
    let hasError = false;
    for (const key of keysToValidate) {
      const error = validateField(key, (formData as any)[key]);
      if (error) hasError = true;
    }
    if (hasError) {
      showValidationAlert('Error', 'Please fix the highlighted errors');
      return;
    }

    // Terms and Privacy must be read and agreed
    if (!hasReadTerms || !hasReadPrivacy) {
      showValidationAlert('Error', 'Please read both Terms & Conditions and Privacy Policy before agreeing');
      return;
    }

    if (!formData.agreeTerms) {
      showValidationAlert('Error', 'You must agree to Terms & Conditions and Privacy Policy');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.submitSignUpForm({
        ...formData,
        email: normalizedEmail,
        registrationToken,
      });
      setModal({
        visible: true,
        type: 'success',
        title: 'Account Created!',
        message: 'Your account has been successfully created. Please wait for admin verification before you can login.'
      });
    } catch (error: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Signup Failed',
        message: error.message || 'Something went wrong. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|yahoo\.com|hotmail\.com|icloud\.com)$/;
  const normalizedEmail = normalizeEmail(formData.email);
  const isNameReadyForOtp = formData.fullName.trim().length > 0;
  const isEmailReadyForOtp = isNameReadyForOtp && emailRegex.test(normalizedEmail) && !otpLoading && !isOtpSent && !isEmailVerified;
  const isOtpReadyToSubmit = otp.trim().length === 6 && timer > 0 && !otpLoading;
  const canAttemptSignup =
    !isLoading &&
    isEmailVerified &&
    verifiedEmail === normalizedEmail &&
    hasReadTerms &&
    hasReadPrivacy &&
    formData.agreeTerms;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView className="h-full bg-gray-50" contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        {/* Top Section */}
        <View className="pt-12 pb-6 px-8 flex items-center bg-gray-50 z-10">
          <LinearGradient
            colors={['#003E2F', '#027A4C']}
            className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center shadow-md"
          >
            <Building2 className="text-white" size={32} strokeWidth={1.5} color="white" />
          </LinearGradient>
          <Text className="text-gray-900 mb-1 text-2xl font-semibold">Create Account</Text>
          <Text className="text-gray-500 text-xs">Join UrbanEase</Text>
        </View>

        {/* Signup Form */}
        <View className="px-6 pb-8">
          <View className="bg-white rounded-3xl p-6 shadow-sm">
            <View className="space-y-4">

              {/* Full Name */}
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text className="text-gray-700 text-xs font-medium">Full Name</Text>
                  {errors.fullName ? <Text style={{ color: '#EF4444', fontSize: 11 }}>{errors.fullName}</Text> : null}
                </View>
                <View className="relative">
                  <View className="absolute left-3 top-3.5 z-10">
                    <User size={16} color={errors.fullName ? '#EF4444' : '#9CA3AF'} strokeWidth={1.5} />
                  </View>
                  <TextInput
                    value={formData.fullName}
                    onChangeText={(text) => handleFieldChange('fullName', text)}
                    placeholder="Enter your full name"
                    editable={!isOtpSent && !isEmailVerified}
                    className="w-full pl-10 pr-3 py-3 border rounded-xl bg-white"
                    style={{ fontSize: 14, borderColor: errors.fullName ? '#EF4444' : '#E5E7EB', borderWidth: 1, borderRadius: 12 }}
                  />
                </View>
              </View>

              {/* Email & OTP Verification Section */}
              <View>
                <Text className="text-gray-700 mb-2 text-xs font-medium">Email Address</Text>
                <View className="flex-row gap-2">
                  <View className="relative flex-1">
                    <View className="absolute left-3 top-3.5 z-10">
                      <Mail size={16} color={isEmailVerified ? "#027A4C" : "#9CA3AF"} strokeWidth={1.5} />
                    </View>
                    <TextInput
                      value={formData.email}
                      onChangeText={handleEmailChange}
                      placeholder="Enter your email"
                      editable={!isEmailVerified && !isOtpSent} // Lock if verified or OTP sent (until cancelled)
                      className={`w-full pl-10 pr-3 py-3 border rounded-xl ${isEmailVerified ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-gray-200'}`}
                      style={{ fontSize: 14 }}
                      autoCapitalize="none"
                    />
                    {isEmailVerified && (
                      <View className="absolute right-3 top-3.5">
                        <CheckCircle size={18} color="#027A4C" fill="#DCFCE7" />
                      </View>
                    )}
                  </View>

                  {!isEmailVerified && !isOtpSent && (
                    <TouchableOpacity
                      onPress={handleSendOtp}
                      disabled={!isEmailReadyForOtp}
                      className={`px-4 rounded-xl justify-center items-center h-[50px] ${isEmailReadyForOtp ? 'bg-[#027A4C]' : 'bg-gray-300'}`}
                    >
                      {otpLoading ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-medium text-xs">Verify</Text>}
                    </TouchableOpacity>
                  )}
                </View>

                {/* OTP Input Area */}
                {isOtpSent && !isEmailVerified && (
                  <View className="mt-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <View className="flex-row items-center justify-between mb-3 bg-white p-2 rounded-lg border border-gray-100">
                      <Text className="text-gray-600 text-xs ml-1">Sent to {formData.email}</Text>
                      {timer > 0 ? (
                        <View className="px-2 py-1 rounded-md bg-green-50">
                          <Text className="text-xs font-bold text-[#027A4C]">{timer}s</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => {
                            setOtp('');
                            setVerifiedEmail('');
                            handleSendOtp();
                          }}
                          className="px-3 py-1.5 rounded-md bg-[#027A4C]"
                        >
                          <Text className="text-xs font-bold text-white">Resend</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="123456"
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={timer > 0}
                      className={`bg-white border border-gray-300 rounded-lg p-3 text-center text-lg font-bold tracking-[5px] mb-3 ${timer > 0 ? 'text-gray-800' : 'text-gray-400 bg-gray-100'}`}
                    />
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => {
                          setIsOtpSent(false);
                          setOtp('');
                          setTimer(60);
                          setVerifiedEmail('');
                          setIsEmailVerified(false);
                        }}
                        className="flex-1 py-3 bg-gray-200 rounded-lg items-center"
                      >
                        <Text className="text-gray-600 font-medium text-xs">Change Email</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleVerifyOtp}
                        disabled={!isOtpReadyToSubmit}
                        className={`flex-1 py-3 rounded-lg items-center ${isOtpReadyToSubmit ? 'bg-[#027A4C]' : 'bg-gray-300'}`}
                      >
                        {otpLoading ? <ActivityIndicator color="white" size="small" /> : <Text className={`font-bold text-xs ${isOtpReadyToSubmit ? 'text-white' : 'text-gray-500'}`}>Submit OTP</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Only show remaining fields if email is verified */}
              {isEmailVerified && (
                <View style={{ gap: 16 }}>
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text className="text-gray-700 text-xs font-medium">CNIC Number</Text>
                      {errors.cnic ? <Text style={{ color: '#EF4444', fontSize: 11 }}>{errors.cnic}</Text> : null}
                    </View>
                    <View className="relative">
                      <View className="absolute left-3 top-3.5 z-10">
                        <CreditCard size={16} color={errors.cnic ? '#EF4444' : '#9CA3AF'} strokeWidth={1.5} />
                      </View>
                      <TextInput
                        value={formData.cnic}
                        onChangeText={(text) => {
                          const digits = text.replace(/\D/g, '').slice(0, 13);
                          let formatted = digits;
                          if (digits.length > 5) formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
                          if (digits.length > 12) formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
                          const newFormData = { ...formData, cnic: formatted };
                          setFormData(newFormData);
                          validateField('cnic', formatted, newFormData);
                        }}
                        keyboardType="numeric"
                        placeholder="XXXXX-XXXXXXX-X"
                        className="w-full pl-10 pr-3 py-3 border rounded-xl bg-white text-gray-900"
                        style={{ fontSize: 14, borderColor: errors.cnic ? '#EF4444' : '#E5E7EB', borderWidth: 1, borderRadius: 12 }}
                      />
                    </View>
                  </View>

                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text className="text-gray-700 text-xs font-medium">Phone Number</Text>
                      {errors.phone ? <Text style={{ color: '#EF4444', fontSize: 11 }}>{errors.phone}</Text> : null}
                    </View>
                    <View className="relative">
                      <View className="absolute left-3 top-3.5 z-10">
                        <Phone size={16} color={errors.phone ? '#EF4444' : '#9CA3AF'} strokeWidth={1.5} />
                      </View>
                      <TextInput
                        value={formData.phone || '+92'}
                        onChangeText={(text) => {
                          handlePhoneChange(text);
                          // Validate after a tick so formData is updated
                          setTimeout(() => {
                            const phoneDigits = text.replace(/\D/g, '');
                            let phoneErr = '';
                            if (phoneDigits.length < 12) phoneErr = 'Phone must be +92 followed by 10 digits';
                            setErrors(prev => ({ ...prev, phone: phoneErr }));
                          }, 0);
                        }}
                        placeholder="+92 301-0816789"
                        keyboardType="phone-pad"
                        className="w-full pl-10 pr-10 py-3 border rounded-xl bg-white"
                        style={{ fontSize: 14, borderColor: errors.phone ? '#EF4444' : '#E5E7EB', borderWidth: 1, borderRadius: 12 }}
                        maxLength={15}
                      />
                      {formData.phone && formData.phone.replace(/\D/g, '').length === 12 && (
                        <View className="absolute right-3 top-3.5">
                          <CheckCircle size={16} color="#027A4C" />
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-400 text-xs mt-1">Format: +92 301-0816789</Text>
                  </View>

                  <View>
                    <Text className="text-gray-700 mb-2 text-xs font-medium">Property Type</Text>
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => setFormData({ ...formData, propertyType: "house" })}
                        className={`flex-1 py-3 rounded-xl border-2 items-center ${formData.propertyType === "house" ? "border-[#027A4C] bg-[#F1F8F4]" : "border-gray-200"}`}
                      >
                        <Text className={formData.propertyType === "house" ? "text-[#027A4C] font-medium" : "text-gray-600"}>House</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setFormData({ ...formData, propertyType: "apartment" })}
                        className={`flex-1 py-3 rounded-xl border-2 items-center ${formData.propertyType === "apartment" ? "border-[#027A4C] bg-[#F1F8F4]" : "border-gray-200"}`}
                      >
                        <Text className={formData.propertyType === "apartment" ? "text-[#027A4C] font-medium" : "text-gray-600"}>Apartment</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View>
                    <Text className="text-gray-700 mb-2 text-xs font-medium">Ownership</Text>
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => setFormData({ ...formData, ownership: "owner" })}
                        className={`flex-1 py-3 rounded-xl border-2 items-center ${formData.ownership === "owner" ? "border-[#027A4C] bg-[#F1F8F4]" : "border-gray-200"}`}
                      >
                        <Text className={formData.ownership === "owner" ? "text-[#027A4C] font-medium" : "text-gray-600"}>Owner</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setFormData({ ...formData, ownership: "tenant" })}
                        className={`flex-1 py-3 rounded-xl border-2 items-center ${formData.ownership === "tenant" ? "border-[#027A4C] bg-[#F1F8F4]" : "border-gray-200"}`}
                      >
                        <Text className={formData.ownership === "tenant" ? "text-[#027A4C] font-medium" : "text-gray-600"}>Tenant</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {formData.propertyType === 'house' ? (
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text className="text-gray-700 text-xs font-medium">Block / Sector</Text>
                          {errors.block ? <Text style={{ color: '#EF4444', fontSize: 9 }}>{errors.block}</Text> : null}
                        </View>
                        <TextInput
                          value={formData.block}
                          onChangeText={text => {
                            const letter = text.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 1);
                            handleFieldChange('block', letter);
                          }}
                          placeholder="A"
                          maxLength={1}
                          autoCapitalize="characters"
                          className="w-full px-3 py-3 border rounded-xl bg-white"
                          style={{ fontSize: 14, borderColor: errors.block ? '#EF4444' : '#E5E7EB', borderWidth: 1, borderRadius: 12 }}
                        />
                      </View>
                      <View className="flex-1">
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text className="text-gray-700 text-xs font-medium">Street</Text>
                          {errors.street ? <Text style={{ color: '#EF4444', fontSize: 9 }}>{errors.street}</Text> : null}
                        </View>
                        <TextInput
                          value={formData.street}
                          onChangeText={text => {
                            const digits = text.replace(/\D/g, '').slice(0, 3);
                            handleFieldChange('street', digits);
                          }}
                          placeholder="1"
                          maxLength={3}
                          keyboardType="number-pad"
                          className="w-full px-3 py-3 border rounded-xl bg-white"
                          style={{ fontSize: 14, borderColor: errors.street ? '#EF4444' : '#E5E7EB', borderWidth: 1, borderRadius: 12 }}
                        />
                      </View>
                      <View className="flex-1">
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text className="text-gray-700 text-xs font-medium">House</Text>
                          {errors.houseNo ? <Text style={{ color: '#EF4444', fontSize: 9 }}>{errors.houseNo}</Text> : null}
                        </View>
                        <TextInput
                          value={formData.houseNo}
                          onChangeText={text => {
                            const digits = text.replace(/\D/g, '').slice(0, 3);
                            handleFieldChange('houseNo', digits);
                          }}
                          placeholder="1"
                          maxLength={3}
                          keyboardType="number-pad"
                          className="w-full px-3 py-3 border rounded-xl bg-white"
                          style={{ fontSize: 14, borderColor: errors.houseNo ? '#EF4444' : '#E5E7EB', borderWidth: 1, borderRadius: 12 }}
                        />
                      </View>
                    </View>
                  ) : (
                    <View className="space-y-4">
                      <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text className="text-gray-700 text-xs font-medium">Plaza Name</Text>
                          {errors.plazaName ? <Text style={{ color: '#EF4444', fontSize: 11 }}>{errors.plazaName}</Text> : null}
                        </View>
                        <TextInput value={formData.plazaName || ''} onChangeText={text => handleFieldChange('plazaName', text)} placeholder="Enter plaza name" className="w-full px-3 py-3 border rounded-xl bg-white" style={{ fontSize: 14, borderColor: errors.plazaName ? '#EF4444' : '#E5E7EB', borderWidth: 1, borderRadius: 12 }} />
                      </View>
                      <View className="flex-row gap-3">
                        <View className="flex-1">
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text className="text-gray-700 text-xs font-medium">Floor</Text>
                            {errors.floorNumber ? <Text style={{ color: '#EF4444', fontSize: 9 }}>{errors.floorNumber}</Text> : null}
                          </View>
                          <TextInput value={formData.floorNumber || ''} onChangeText={text => handleFieldChange('floorNumber', text)} placeholder="e.g. 1st" className="w-full px-3 py-3 border rounded-xl bg-white" style={{ fontSize: 14, borderColor: errors.floorNumber ? '#EF4444' : '#E5E7EB', borderWidth: 1, borderRadius: 12 }} />
                        </View>
                        <View className="flex-1">
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text className="text-gray-700 text-xs font-medium">Flat No.</Text>
                            {errors.flatNumber ? <Text style={{ color: '#EF4444', fontSize: 9 }}>{errors.flatNumber}</Text> : null}
                          </View>
                          <TextInput value={formData.flatNumber || ''} onChangeText={text => handleFieldChange('flatNumber', text)} placeholder="e.g. A-1" className="w-full px-3 py-3 border rounded-xl bg-white" style={{ fontSize: 14, borderColor: errors.flatNumber ? '#EF4444' : '#E5E7EB', borderWidth: 1, borderRadius: 12 }} />
                        </View>
                      </View>
                    </View>
                  )}

                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text className="text-gray-700 text-xs font-medium">Password</Text>
                      {errors.password ? <Text style={{ color: '#EF4444', fontSize: 11 }}>{errors.password}</Text> : null}
                    </View>
                    <View className="relative">
                      <View className="absolute left-3 top-3.5 z-10"><Lock size={16} color={errors.password ? '#EF4444' : '#9CA3AF'} strokeWidth={1.5} /></View>
                      <TextInput value={formData.password} onChangeText={(text) => handleFieldChange('password', text)} placeholder="Create password" secureTextEntry={!showPassword} className="w-full pl-10 pr-12 py-3 border rounded-xl bg-white text-gray-900" style={{ fontSize: 14, borderColor: errors.password ? '#EF4444' : '#E5E7EB', borderWidth: 1, borderRadius: 12 }} />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 z-10" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>{showPassword ? <EyeOff size={16} color="#9CA3AF" /> : <Eye size={16} color="#9CA3AF" />}</TouchableOpacity>
                    </View>
                  </View>

                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text className="text-gray-700 text-xs font-medium">Confirm Password</Text>
                      {errors.confirmPassword ? <Text style={{ color: '#EF4444', fontSize: 11 }}>{errors.confirmPassword}</Text> : null}
                    </View>
                    <View className="relative">
                      <View className="absolute left-3 top-3.5 z-10"><Lock size={16} color={errors.confirmPassword ? '#EF4444' : '#9CA3AF'} strokeWidth={1.5} /></View>
                      <TextInput value={formData.confirmPassword} onChangeText={(text) => handleFieldChange('confirmPassword', text)} placeholder="Re-enter password" secureTextEntry={!showConfirmPassword} className="w-full pl-10 pr-12 py-3 border rounded-xl bg-white text-gray-900" style={{ fontSize: 14, borderColor: errors.confirmPassword ? '#EF4444' : '#E5E7EB', borderWidth: 1, borderRadius: 12 }} />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 z-10" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>{showConfirmPassword ? <EyeOff size={16} color="#9CA3AF" /> : <Eye size={16} color="#9CA3AF" />}</TouchableOpacity>
                    </View>
                  </View>

                  {/* Terms and Privacy Policy - Fixed UI */}
                  <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                    <TouchableOpacity
                      onPress={() => {
                        if (hasReadTerms && hasReadPrivacy) {
                          setFormData({ ...formData, agreeTerms: !formData.agreeTerms });
                        } else {
                          Alert.alert('Read Required', 'Please tap on Terms & Conditions and Privacy Policy links to read them first.');
                        }
                      }}
                      activeOpacity={0.7}
                      style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 4 }}
                    >
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: formData.agreeTerms ? '#027A4C' : (!hasReadTerms || !hasReadPrivacy) ? '#D1D5DB' : '#9CA3AF',
                        backgroundColor: formData.agreeTerms ? '#027A4C' : (!hasReadTerms || !hasReadPrivacy) ? '#F3F4F6' : 'white',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        {formData.agreeTerms && <Check size={14} color="white" strokeWidth={3} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#4B5563', fontSize: 13, lineHeight: 20 }}>
                          By registering, you agree to our{' '}
                          <Text
                            style={{ fontWeight: '700', color: hasReadTerms ? '#027A4C' : '#2563EB', textDecorationLine: hasReadTerms ? 'none' : 'underline' }}
                            onPress={(e) => { e.stopPropagation && e.stopPropagation(); setShowTermsModal(true); }}
                          >
                            Terms & Conditions
                          </Text>
                          {' '}and{' '}
                          <Text
                            style={{ fontWeight: '700', color: hasReadPrivacy ? '#027A4C' : '#2563EB', textDecorationLine: hasReadPrivacy ? 'none' : 'underline' }}
                            onPress={(e) => { e.stopPropagation && e.stopPropagation(); setShowPrivacyModal(true); }}
                          >
                            Privacy Policy
                          </Text>
                        </Text>
                        {(!hasReadTerms || !hasReadPrivacy) && (
                          <Text style={{ color: '#F97316', fontSize: 11, marginTop: 6 }}>
                            ⚠️ Please tap and read both documents before agreeing
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={handleSubmit} activeOpacity={0.8} disabled={!canAttemptSignup}>
                    <LinearGradient colors={canAttemptSignup ? ['#003E2F', '#027A4C'] : ['#9CA3AF', '#D1D5DB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-md">
                      {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white text-base font-medium">Create Account</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View className="flex-row justify-center mt-6 pb-4">
            <Text className="text-center text-gray-600 text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}><Text className="text-[#027A4C] font-medium text-sm">Login</Text></TouchableOpacity>
          </View>
        </View>

        {/* Terms & Conditions Modal */}
        <Modal
          visible={showTermsModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowTermsModal(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top', 'bottom']}>
            <View className="flex-row items-center justify-between px-4 border-b border-gray-200" style={{ paddingTop: Math.max(insets.top, 12) + 8, paddingBottom: 12 }}>
              <View className="flex-row items-center gap-2" style={{ flex: 1, paddingRight: 12 }}>
                <FileText size={24} color="#027A4C" />
                <Text className="text-lg font-semibold text-gray-900" style={{ flexShrink: 1 }}>Terms & Conditions</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setHasReadTerms(true);
                  setShowTermsModal(false);
                }}
                className="bg-[#027A4C] px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">I've Read This</Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 px-4 py-4">
              <Text className="text-gray-700 text-sm leading-6">{TERMS_CONTENT}</Text>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Privacy Policy Modal */}
        <Modal
          visible={showPrivacyModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPrivacyModal(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top', 'bottom']}>
            <View className="flex-row items-center justify-between px-4 border-b border-gray-200" style={{ paddingTop: Math.max(insets.top, 12) + 8, paddingBottom: 12 }}>
              <View className="flex-row items-center gap-2" style={{ flex: 1, paddingRight: 12 }}>
                <Shield size={24} color="#027A4C" />
                <Text className="text-lg font-semibold text-gray-900" style={{ flexShrink: 1 }}>Privacy Policy</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setHasReadPrivacy(true);
                  setShowPrivacyModal(false);
                }}
                className="bg-[#027A4C] px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">I've Read This</Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 px-4 py-4">
              <Text className="text-gray-700 text-sm leading-6">{PRIVACY_CONTENT}</Text>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <StatusModal visible={modal.visible} type={modal.type} title={modal.title} message={modal.message} onClose={handleModalClose} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



