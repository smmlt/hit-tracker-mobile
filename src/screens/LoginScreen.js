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
import { LanguageContext } from '../localization/LanguageContext';
import { createUnknownUserCountdown, isUnknownUserError } from '../utils/authFlow';

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const [redirectSeconds, setRedirectSeconds] = useState(0);
  const { handleOAuthRedirect, login, isLoading } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);

  // Стан та анімація для CustomToast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const countdownRef = useRef();
  const emailRef = useRef(email);
  const loginAttemptRef = useRef(0);
  const submittingRef = useRef(false);
  const toastTimerRef = useRef();

  const [errorMessage, setErrorMessage] = useState('');

  const showToast = (message, type = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
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
    if (route?.params?.registered) showToast(t('accountCreated'), 'success');
  }, [route?.params?.prefilledEmail, route?.params?.registered]);

  useEffect(() => {
    emailRef.current = email;
  }, [email]);

  useEffect(() => {
    countdownRef.current = createUnknownUserCountdown({
      onTick: (seconds) => {
        const message = t('userNotFoundRedirect').replace('{seconds}', seconds);
        clearTimeout(toastTimerRef.current);
        setRedirectSeconds(seconds);
        setErrorMessage(message);
        setToastMessage(message);
        setToastType('error');
        setToastVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      },
      onComplete: () => {
        fadeAnim.stopAnimation();
        fadeAnim.setValue(0);
        setToastVisible(false);
        navigation.replace('Register', {
          prefilledEmail: emailRef.current.trim().toLowerCase(),
        });
      },
    });
    return () => {
      loginAttemptRef.current += 1;
      countdownRef.current?.cancel();
      clearTimeout(toastTimerRef.current);
      fadeAnim.stopAnimation();
    };
  }, [fadeAnim, navigation, t]);

  useEffect(() => {
    if (!retryAfterSeconds) return undefined;
    const timer = setInterval(() => {
      setRetryAfterSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfterSeconds]);

  const handleAppleLogin = () => {
    showToast(t('appleComingSoon'), 'error');
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
    if (submittingRef.current) return;
    const normalizedEmail = email.trim().toLowerCase();
    const validationError = !normalizedEmail || !password ? t('fillAllFields')
      : !isValidEmail(normalizedEmail) ? t('enterValidEmail') : '';
    if (validationError) {
      setErrorMessage(validationError);
      return showToast(validationError, 'error');
    }

    const attempt = ++loginAttemptRef.current;
    submittingRef.current = true;
    try {
      countdownRef.current?.cancel();
      setRedirectSeconds(0);
      setErrorMessage('');
      setEmail(normalizedEmail);
      await login(normalizedEmail, password);
      if (attempt !== loginAttemptRef.current) return;
      countdownRef.current?.cancel();
    } catch (err) {
      if (attempt !== loginAttemptRef.current) return;
      const status = err.status || err.response?.status;

      if (status === 429) {
        setRetryAfterSeconds(err.retryAfterSeconds || 30 * 60);
        return;
      }

      const message = isUnknownUserError(err) ? t('userNotFound')
        : err.details?.code === 'INVALID_CREDENTIALS' ? t('invalidPassword')
        : err.details?.code === 'EMAIL_NOT_VERIFIED' ? t('emailNotVerified')
        : err.details?.code === 'GOOGLE_SIGN_IN_REQUIRED' ? t('googleSignInRequired')
        : err.message || t('loginFailed');
      if (isUnknownUserError(err)) {
        countdownRef.current?.start();
      } else {
        setErrorMessage(message);
        showToast(message, 'error');
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const cancelPendingLogin = () => {
    loginAttemptRef.current += 1;
    countdownRef.current?.cancel();
    setRedirectSeconds(0);
    setErrorMessage('');
    clearTimeout(toastTimerRef.current);
    fadeAnim.stopAnimation();
    fadeAnim.setValue(0);
    setToastVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.formWrapper}>
            <Text style={styles.title}>{t('signIn')}</Text>
            <Text style={styles.subtitle}>{t('welcomeBack')}</Text>

            <CustomInput
              label={t('email')}
              placeholder={t('emailPlaceholder')}
              value={email}
              onChangeText={(text) => { cancelPendingLogin(); setEmail(text); }}
              keyboardType="email-address"
            />

            <CustomInput
              label={t('password')}
              placeholder="********"
              value={password}
              onChangeText={(text) => { cancelPendingLogin(); setPassword(text); }}
              isPassword
              secureTextEntry={!showPassword}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPass}>
              <Text style={styles.forgotPassText}>{t('forgotPassword')}</Text>
            </TouchableOpacity>

            <PrimaryButton
              title={retryAfterSeconds ? t('tryAgainIn').replace('{seconds}', retryAfterSeconds) : t('signIn')}
              onPress={handleLogin}
              isLoading={isLoading}
              disabled={retryAfterSeconds > 0 || redirectSeconds > 0}
            />
            {retryAfterSeconds > 0 && (
              <Text style={styles.rateLimitMessage}>
                {t('tooManyAttempts').replace('{seconds}', retryAfterSeconds)}
              </Text>
            )}
            {!!errorMessage && <Text style={styles.rateLimitMessage}>{redirectSeconds ? t('userNotFoundRedirect').replace('{seconds}', redirectSeconds) : errorMessage}</Text>}

            <Divider />

            <SocialButton title={t('continueWithApple')} iconName="logo-apple" onPress={handleAppleLogin} />
            <SocialButton title={t('continueWithGoogle')} iconName="logo-google" onPress={handleGoogleLogin} />

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.bottomLinkContainer}>
              <Text style={styles.bottomText}>
                {t('noAccount')} <Text style={styles.boldText}>{t('signUp')}</Text>
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
