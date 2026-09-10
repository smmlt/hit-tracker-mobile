import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Animated } from 'react-native';
import { createStyles } from './RegisterScreen.styles.js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { isValidEmail, getPasswordCriteria, isValidPassword } from '../utils/validation';
import { BackButton, CustomInput, PrimaryButton, SocialButton, Divider } from '../components/auth';
import { CustomToast } from '../components/feedback';
import { API_URL } from '../constants/config';
import { createPkcePair } from '../utils/oauthPkce';
import { LanguageContext } from '../localization/LanguageContext';
import { completeRegistration } from '../utils/authFlow';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen({ navigation, route }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { handleOAuthRedirect, register, isLoading } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);

  // Состояние и анимация для CustomToast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const [errorMessage, setErrorMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const submittingRef = useRef(false);
  const toastTimerRef = useRef();

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

  const criteria = getPasswordCriteria(password);

  useEffect(() => () => {
    clearTimeout(toastTimerRef.current);
    fadeAnim.stopAnimation();
  }, [fadeAnim]);

  const handleAppleLogin = () => {
    showToast(t('appleComingSoon'), 'error');
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
    if (submittingRef.current) return;
    const normalizedEmail = email.trim().toLowerCase();
    const validationError = !fullName.trim() ? t('enterFullName')
      : !isValidEmail(normalizedEmail) ? t('enterValidEmail')
      : !isValidPassword(password) ? t('passwordRequirements') : '';
    if (validationError) {
      setErrorMessage(validationError);
      return showToast(validationError, 'error');
    }

    try {
      submittingRef.current = true;
      setErrorMessage('');
      await completeRegistration({
        displayName: fullName.trim(),
        email: normalizedEmail,
        password,
        register,
        persistEmail: (value) => AsyncStorage.setItem('pendingRegistrationEmail', value),
        navigate: (value) => navigation.replace('VerifyEmail', { email: value }),
      });
    } catch (err) {
      const message = err.message || t('registrationFailed');
      setErrorMessage(message);
      showToast(message, 'error');
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <BackButton onPress={() => navigation.goBack()} />

          <View style={styles.formWrapper}>
            <Text style={styles.title}>{t('createAccount')}</Text>
            <Text style={styles.subtitle}>{t('startYourJourney')}</Text>

            <CustomInput
              label={t('fullName')}
              placeholder={t('yourName')}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <CustomInput
              label={t('email')}
              placeholder={t('emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <CustomInput
              label={t('password')}
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
                {criteria.minLength ? '✓' : '•'} {t('atLeastEight')}
              </Text>
              <Text style={[styles.hintItem, criteria.hasUpper ? styles.hintSuccess : styles.hintPending]}>
                {criteria.hasUpper ? '✓' : '•'} {t('uppercaseLetter')}
              </Text>
              <Text style={[styles.hintItem, criteria.hasNumber ? styles.hintSuccess : styles.hintPending]}>
                {criteria.hasNumber ? '✓' : '•'} {t('number')}
              </Text>
            </View>

            <PrimaryButton title={t('createAccount')} onPress={handleRegister} isLoading={isLoading} />
            {!!errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}

            <Divider />

            <SocialButton title={t('continueWithApple')} iconName="logo-apple" onPress={handleAppleLogin} />
            <SocialButton title={t('continueWithGoogle')} iconName="logo-google" onPress={handleGoogleLogin} />

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.bottomLinkContainer}>
              <Text style={styles.bottomText}>
                {t('alreadyHaveAccount')} <Text style={styles.boldText}>{t('signIn')}</Text>
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
