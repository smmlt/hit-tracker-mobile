import React, { useContext, useState, useRef } from 'react';
import { View, Text, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { createStyles } from './ResetPasswordScreen.styles.js';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, CustomInput, PrimaryButton } from '../components/auth';
import { CustomToast } from '../components/feedback';
import { apiRequest } from '../services/api';
import { LanguageContext } from '../localization/LanguageContext';

import { palette } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
export default function ResetPasswordScreen({ navigation, route }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const token = route?.params?.token;
  const { t } = useContext(LanguageContext);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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

  // Розрахунок вимог до пароля
  const requirements = [
    { label: t('atLeastEight'), met: password.length >= 8 },
    { label: t('uppercaseLetter'), met: /[A-Z]/.test(password) },
    { label: t('lowercaseLetter'), met: /[a-z]/.test(password) },
    { label: t('number'), met: /[0-9]/.test(password) },
    { label: t('specialCharacter'), met: /[^A-Za-z0-9]/.test(password) },
  ];

  const getPasswordStrength = () => {
    let score = requirements.filter(r => r.met).length;
    if (password.length >= 12) score++; // Бонус за довжину
    return score;
  };

  const strength = getPasswordStrength();

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) return showToast(t('fillAllFields'));
    if (password.length < 8) return showToast(t('passwordMinLength'));
    if (password !== confirmPassword) return showToast(t('passwordsDoNotMatch'));

    const allRequirementsMet = requirements.every(r => r.met);
    if (!allRequirementsMet) return showToast(t('passwordAllRequirements'));

    setIsLoading(true);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password }),
      }, null, 'Failed to reset password');

      setIsSuccess(true);
    } catch (err) {
      showToast(err.message || t('somethingWentWrong'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.formWrapper}>
            {!isSuccess ? (
              <>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.title}>{t('createNewPassword')}</Text>
                <Text style={styles.subtitle}>{t('newPasswordHint')}</Text>

                <CustomInput
                  label={t('newPassword')}
                  placeholder="********"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  secureTextEntry={!showPassword}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />

                {/* Індикатор сили пароля */}
                <View style={styles.strengthContainer}>
                  <Text style={styles.strengthText}>
                    {strength >= 5 ? t('strong') : strength >= 3 ? t('medium') : t('weak')}
                  </Text>
                  <View style={styles.barsRow}>
                    {[1, 2, 3, 4, 5, 6].map((index) => (
                      <View
                        key={index}
                        style={[
                          styles.bar,
                          index <= strength ? styles.barActive : styles.barInactive
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* Чекліст вимог до пароля */}
                <View style={styles.requirementsContainer}>
                  {requirements.map((req, idx) => (
                    <View key={idx} style={styles.requirementRow}>
                      <Ionicons 
                        name={req.met ? "checkmark-circle" : "ellipse-outline"} 
                        size={16} 
                        color={req.met ? palette.success : palette.gray500}
                      />
                      <Text style={[styles.requirementText, req.met && styles.requirementMetText]}>
                        {req.label}
                      </Text>
                    </View>
                  ))}
                </View>

                <CustomInput
                  label={t('confirmPassword')}
                  placeholder="********"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  secureTextEntry={!showConfirmPassword}
                  showPassword={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                />

                <View style={styles.fullWidthButton}>
                  <PrimaryButton title={t('resetPassword')} onPress={handleResetPassword} isLoading={isLoading} />
                </View>
              </>
            ) : (
              <View style={styles.centerContent}>
                <View style={styles.iconCircle}>
                  <Ionicons name="checkmark" size={48} color={theme.textPrimary} />
                </View>

                <Text style={[styles.title, { textAlign: 'center' }]}>{t('passwordReset')}</Text>
                <Text style={[styles.title, { textAlign: 'center', marginTop: -4 }]}>{t('allSet')}</Text>
                <Text style={[styles.subtitle, { textAlign: 'center', marginTop: 8, marginBottom: 32 }]}>
                  {t('canSignInNow')}
                </Text>

                <View style={styles.fullWidthButton}>
                  <PrimaryButton title={t('goToSignIn')} onPress={() => navigation.navigate('Login')} />
                </View>
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
