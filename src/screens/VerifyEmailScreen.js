import React, { useContext, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BackButton, CustomInput, PrimaryButton } from '../components/auth';
import { CustomToast } from '../components/feedback';
import { AuthContext } from '../context/AuthContext';

export default function VerifyEmailScreen({ navigation, route }) {
  const [code, setCode] = useState('');
  const { verifyRegistration, isLoading } = useContext(AuthContext);
  const email = route.params?.email || '';
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      showToast('Enter the 6-digit code from your email.');
      return;
    }

    try {
      await verifyRegistration(email, code);
    } catch (error) {
      showToast(error.message || 'Email verification failed.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.formWrapper}>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to {email || 'your email'}. It expires in 15 minutes.
            </Text>
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
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.bottomLinkContainer}>
              <Text style={styles.bottomText}>Already have an account? <Text style={styles.boldText}>Sign in</Text></Text>
            </TouchableOpacity>
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
  bottomLinkContainer: { alignItems: 'center', marginTop: 28 },
  bottomText: { color: '#6B7280', fontSize: 14 },
  boldText: { color: '#000', fontWeight: '700' },
});
