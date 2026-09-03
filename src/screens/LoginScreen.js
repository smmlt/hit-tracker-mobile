import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity, 
  Animated 
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AuthContext } from '../context/AuthContext';
import { isValidEmail } from '../utils/validation';
import { CustomInput, PrimaryButton, SocialButton, Divider } from '../components/auth';
import { CustomToast } from '../components/feedback';
import { API_URL } from '../constants/config';
import { createPkcePair } from '../utils/oauthPkce';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const { handleOAuthRedirect, login, isLoading } = useContext(AuthContext);

  // Стан та анімація для CustomToast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const showToast = (message, type = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      hideToast();
    }, 3500);
  };

  const hideToast = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setToastVisible(false));
  };

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (!retryAfterSeconds) return undefined;
    const timer = setInterval(() => {
      setRetryAfterSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfterSeconds]);

  const handleAppleLogin = () => {
    showToast('Sign in with Apple is currently in development', 'error');
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      window.location.href = `${API_URL}/auth/google`;
    } else {
      const redirectUrl = Linking.createURL('auth/google/callback');
      const { verifier, challenge } = await createPkcePair();
      const backendOAuthUrl = `${API_URL}/auth/google?platform=mobile&code_challenge=${encodeURIComponent(challenge)}`;
      const result = await WebBrowser.openAuthSessionAsync(backendOAuthUrl, redirectUrl);
      if (result.type === 'success') await handleOAuthRedirect(result.url, verifier);
    }
  };

  const handleLogin = async () => {
    clearTimers();

    if (!email || !password) return showToast('Please fill in all fields', 'error');
    if (!isValidEmail(email)) return showToast('Please enter a valid email', 'error');

    try {
      await login(email, password);
    } catch (err) {
      const status = err.status || err.response?.status;
      const message = (err.message || '').toLowerCase();

      if (status === 429) {
        setRetryAfterSeconds(err.retryAfterSeconds || 30 * 60);
        return;
      }

      const isNotFound = status === 404 || message.includes('not found');

      if (isNotFound) {
        let secondsLeft = 3;
        showToast(`User not found. Redirecting in ${secondsLeft}s...`, 'error');

        intervalRef.current = setInterval(() => {
          secondsLeft -= 1;
          if (secondsLeft > 0) {
            showToast(`User not found. Redirecting in ${secondsLeft}s...`, 'error');
          } else {
            clearInterval(intervalRef.current);
          }
        }, 1000);

        timerRef.current = setTimeout(() => {
          navigation.navigate('Register', { prefilledEmail: email });
        }, 3000);
      } else {
        showToast(err.message || 'Login failed', 'error');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.formWrapper}>
            <Text style={styles.title}>Sing In</Text>
            <Text style={styles.subtitle}>Welcome back</Text>

            <CustomInput
              label="Email"
              placeholder="you@exemple.com"
              value={email}
              onChangeText={(text) => { setEmail(text); clearTimers(); }}
              keyboardType="email-address"
            />

            <CustomInput
              label="Password"
              placeholder="********"
              value={password}
              onChangeText={(text) => { setPassword(text); clearTimers(); }}
              isPassword
              secureTextEntry={!showPassword}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPass}>
              <Text style={styles.forgotPassText}>Forgot password?</Text>
            </TouchableOpacity>

            <PrimaryButton
              title={retryAfterSeconds ? `Try again in ${Math.ceil(retryAfterSeconds / 60)} min` : 'Sing In'}
              onPress={handleLogin}
              isLoading={isLoading}
              disabled={retryAfterSeconds > 0}
            />
            {retryAfterSeconds > 0 && (
              <Text style={styles.rateLimitMessage}>
                Too many attempts. Please try again in {retryAfterSeconds} seconds.
              </Text>
            )}

            <Divider />

            <SocialButton title="Continue with Apple" iconName="logo-apple" onPress={handleAppleLogin} />
            <SocialButton title="Continue with Google" iconName="logo-google" onPress={handleGoogleLogin} />

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.bottomLinkContainer}>
              <Text style={styles.bottomText}>
                Dont have an account? <Text style={styles.boldText}>Sing up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Тост для сповіщень */}
      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        variant="light"
        fadeAnim={fadeAnim}
        onClose={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 20, 
    maxWidth: 440, 
    width: '100%', 
    alignSelf: 'center' 
  },
  formWrapper: { width: '100%' },
  title: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 28 },
  forgotPass: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotPassText: { fontSize: 13, color: '#000', fontWeight: '500' },
  rateLimitMessage: { color: '#DC2626', fontSize: 13, lineHeight: 18, marginTop: 10, textAlign: 'center' },
  bottomLinkContainer: { marginTop: 32, alignItems: 'center' },
  bottomText: { color: '#6B7280', fontSize: 14 },
  boldText: { color: '#000', fontWeight: '700' },
});
