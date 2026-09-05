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

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { handleOAuthRedirect, login, isLoading } = useContext(AuthContext);

  // Стан та анімація для CustomToast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const [redirectSeconds, setRedirectSeconds] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (route?.params?.prefilledEmail) setEmail(route.params.prefilledEmail);
    if (route?.params?.registered) showToast('Account created. You can sign in now.', 'success');
  }, [route?.params?.prefilledEmail, route?.params?.registered]);

  useEffect(() => {
    if (!redirectSeconds) return undefined;

    const timer = setTimeout(() => {
      if (redirectSeconds === 1) {
        navigation.replace('Register', { prefilledEmail: email });
      } else {
        setRedirectSeconds((seconds) => seconds - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [email, navigation, redirectSeconds]);

  const handleAppleLogin = () => {
    showToast('Sign in with Apple is currently in development', 'error');
  };

  const handleGoogleLogin = async () => {
    const backendOAuthUrl = `${API_URL}/auth/google`;
    
    if (Platform.OS === 'web') {
      window.location.href = backendOAuthUrl;
    } else {
      const result = await WebBrowser.openAuthSessionAsync(backendOAuthUrl, Linking.createURL('/auth/google/callback'));
      if (result.type === 'success') await handleOAuthRedirect(result.url);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return showToast('Please fill in all fields', 'error');
    if (!isValidEmail(email)) return showToast('Please enter a valid email', 'error');

    try {
      await login(email, password);
    } catch (err) {
      const status = err.status || err.response?.status;
      if (status === 404) {
        setRedirectSeconds(5);
        showToast('User with this email was not found. Redirecting to registration in 5 seconds...', 'error');
      } else if (status === 401) {
        showToast('Incorrect password', 'error');
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
              onChangeText={(text) => { setEmail(text); setRedirectSeconds(0); }}
              keyboardType="email-address"
            />

            <CustomInput
              label="Password"
              placeholder="********"
              value={password}
              onChangeText={(text) => { setPassword(text); setRedirectSeconds(0); }}
              isPassword
              secureTextEntry={!showPassword}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPass}>
              <Text style={styles.forgotPassText}>Forgot password?</Text>
            </TouchableOpacity>

            <PrimaryButton title="Sing In" onPress={handleLogin} isLoading={isLoading} />

            {redirectSeconds > 0 && (
              <Text style={styles.redirectMessage}>
                User with this email was not found. Redirecting to registration in {redirectSeconds}s...
              </Text>
            )}

            <Divider />

            <SocialButton title="Continue with Apple" iconName="logo-apple" onPress={handleAppleLogin} />
            <SocialButton title="Continue with Google" iconName="logo-google" onPress={handleGoogleLogin} />

            <TouchableOpacity onPress={() => { setRedirectSeconds(0); navigation.navigate('Register'); }} style={styles.bottomLinkContainer}>
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
  redirectMessage: { color: '#DC2626', fontSize: 13, lineHeight: 18, marginTop: 10, textAlign: 'center' },
  bottomLinkContainer: { marginTop: 32, alignItems: 'center' },
  bottomText: { color: '#6B7280', fontSize: 14 },
  boldText: { color: '#000', fontWeight: '700' },
});
