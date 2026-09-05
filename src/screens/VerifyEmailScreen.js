import React, { useContext, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BackButton, CustomInput, PrimaryButton } from '../components/auth';
import { CustomToast } from '../components/feedback';
import { AuthContext } from '../context/AuthContext';

export default function VerifyEmailScreen({ navigation, route }) {
  const [code, setCode] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { verifyRegistration, isLoading } = useContext(AuthContext);
  const email = route.params?.email || '';

  const hideToast = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
      .start(() => setToastVisible(false));
  };

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    setTimeout(hideToast, 3500);
  };

  const verificationMessage = (error) => {
    if (error.status === 410 || error.details?.code === 'CODE_EXPIRED') {
      return 'Verification code has expired. Please register again to get a new code.';
    }
    if (error.details?.code === 'INVALID_CODE' || error.status === 400) {
      return 'Incorrect verification code. Please try again.';
    }
    return error.message || 'Unable to verify email. Please try again.';
  };

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      showToast('Enter the 6-digit code from your email.');
      return;
    }
    if (!email) {
      showToast('Registration email is missing. Please register again.');
      return;
    }

    try {
      await verifyRegistration(email, code);
      navigation.replace('Login', { prefilledEmail: email, registered: true });
    } catch (error) {
      showToast(verificationMessage(error));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.formWrapper}>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>We sent a 6-digit code to {email}. Enter it to create your account.</Text>
            <CustomInput
              label="Confirmation code"
              placeholder="000000"
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
            />
            <PrimaryButton title="Verify and create account" onPress={handleVerify} isLoading={isLoading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomToast visible={toastVisible} message={toastMessage} type="error" variant="light" fadeAnim={fadeAnim} onClose={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { alignSelf: 'center', flexGrow: 1, justifyContent: 'center', maxWidth: 440, paddingHorizontal: 24, paddingVertical: 20, width: '100%' },
  formWrapper: { width: '100%' },
  title: { color: '#000', fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#6B7280', fontSize: 16, lineHeight: 23, marginBottom: 28 },
});
