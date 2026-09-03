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
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { AuthContext } from '../context/AuthContext';
import { isValidEmail, getPasswordCriteria, isValidPassword } from '../utils/validation';
import { BackButton, CustomInput, PrimaryButton, SocialButton, Divider } from '../components/auth';
import { CustomToast } from '../components/feedback';
import { API_URL } from '../constants/config';
import { createPkcePair } from '../utils/oauthPkce';

export default function RegisterScreen({ navigation, route }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { handleOAuthRedirect, register, isLoading } = useContext(AuthContext);

  // Состояние и анимация для CustomToast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (route?.params?.prefilledEmail) {
      setEmail(route.params.prefilledEmail);
    }
  }, [route?.params?.prefilledEmail]);

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

  const criteria = getPasswordCriteria(password);

  const handleAppleLogin = () => {
    showToast('Sign in with Apple is currently in development', 'error');
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      // Для вебу робимо перенаправлення у тій самій вкладці
      window.location.href = `${API_URL}/auth/google`;
    } else {
      const redirectUrl = Linking.createURL('auth/google/callback');
      const { verifier, challenge } = await createPkcePair();
      const backendOAuthUrl = `${API_URL}/auth/google?platform=mobile&code_challenge=${encodeURIComponent(challenge)}`;
      const result = await WebBrowser.openAuthSessionAsync(
        backendOAuthUrl,
        redirectUrl,
      );

      if (result.type === 'cancel' || result.type === 'dismiss') {
        navigation.navigate('Login');
      }
      if (result.type === 'success') await handleOAuthRedirect(result.url, verifier);
    }
  };

  const handleRegister = async () => {
    if (!fullName) return showToast('Please enter your full name', 'error');
    if (!isValidEmail(email)) return showToast('Please enter a valid email', 'error');
    if (!isValidPassword(password)) return showToast('Password does not meet requirements', 'error');

    try {
      await register(email, password, fullName);
      navigation.navigate('VerifyEmail', { email });
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <BackButton onPress={() => navigation.goBack()} />

          <View style={styles.formWrapper}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start your journey</Text>

            <CustomInput
              label="Full name"
              placeholder="Your name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <CustomInput
              label="Email"
              placeholder="you@exemple.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <CustomInput
              label="Password"
              placeholder="********"
              value={password}
              onChangeText={setPassword}
              isPassword
              secureTextEntry={!showPassword}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <View style={styles.hintsContainer}>
              <Text style={[styles.hintItem, criteria.minLength ? styles.hintSuccess : styles.hintPending]}>
                {criteria.minLength ? '✓' : '•'} At least 8 characters
              </Text>
              <Text style={[styles.hintItem, criteria.hasUpper ? styles.hintSuccess : styles.hintPending]}>
                {criteria.hasUpper ? '✓' : '•'} At least one uppercase letter
              </Text>
              <Text style={[styles.hintItem, criteria.hasNumber ? styles.hintSuccess : styles.hintPending]}>
                {criteria.hasNumber ? '✓' : '•'} At least one number
              </Text>
            </View>

            <PrimaryButton title="Create account" onPress={handleRegister} isLoading={isLoading} />

            <Divider />

            <SocialButton title="Continue with Apple" iconName="logo-apple" onPress={handleAppleLogin} />
            <SocialButton title="Continue with Google" iconName="logo-google" onPress={handleGoogleLogin} />

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.bottomLinkContainer}>
              <Text style={styles.bottomText}>
                Already have an account? <Text style={styles.boldText}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Светлый тост под тему авторизации */}
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
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 20 },
  hintsContainer: { marginTop: -4, marginBottom: 16 },
  hintItem: { fontSize: 13, marginBottom: 4 },
  hintPending: { color: '#9CA3AF' },
  hintSuccess: { color: '#10B981', fontWeight: '600' },
  bottomLinkContainer: { marginTop: 24, alignItems: 'center' },
  bottomText: { color: '#6B7280', fontSize: 14 },
  boldText: { color: '#000', fontWeight: '700' },
});
