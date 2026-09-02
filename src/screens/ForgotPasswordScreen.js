import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity, 
  Linking,
  Animated 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isValidEmail } from '../utils/validation';
import { BackButton, CustomInput, PrimaryButton } from '../components/auth';
import { CustomToast } from '../components/feedback';
import { apiRequest } from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    setTimeout(() => hideToast(), 3500);
  };

  const hideToast = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
      .start(() => setToastVisible(false));
  };

  const handleSendLink = async () => {
    if (!email) return showToast('Please enter your email address');
    if (!isValidEmail(email)) return showToast('Please enter a valid email address');

    setIsLoading(true);
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }, null, 'Failed to send reset link');

      setIsSent(true);
    } catch (err) {
      showToast(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEmailApp = () => {
    Linking.openURL('mailto:');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.formWrapper}>
            {!isSent ? (
              <>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.title}>Forgot password?</Text>
                <Text style={styles.subtitle}>Enter your email and we’ll send you a reset link.</Text>

                <CustomInput
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />

                <View style={styles.fullWidthButton}>
                  <PrimaryButton title="Send link" onPress={handleSendLink} isLoading={isLoading} />
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
                  <Text style={styles.linkText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.centerContent}>
                <View style={styles.iconCircle}>
                  <Ionicons name="mail-unread-outline" size={48} color="#000" />
                </View>

                <Text style={[styles.title, { textAlign: 'center' }]}>Check your Email</Text>
                <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 24 }]}>
                  We’ve sent a password reset link to{'\n'}
                  <Text style={{ fontWeight: '600', color: '#000' }}>{email}</Text>
                </Text>

                <View style={styles.fullWidthButton}>
                  <PrimaryButton title="Open Email App" onPress={handleOpenEmailApp} />
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
                  <Text style={styles.linkText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type="error"
        variant="light"
        fadeAnim={fadeAnim}
        onClose={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20, maxWidth: 440, width: '100%', alignSelf: 'center' },
  formWrapper: { width: '100%' },
  centerContent: { alignItems: 'center', width: '100%' },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 24, lineHeight: 22 },
  linkContainer: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#000', fontWeight: '700', fontSize: 14 },
  fullWidthButton: { width: '100%', marginTop: 16 },
});
