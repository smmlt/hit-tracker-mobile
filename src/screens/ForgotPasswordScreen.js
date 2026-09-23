import React, { useContext, useState, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Linking, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStyles } from './ForgotPasswordScreen.styles.js';
import { Ionicons } from '@expo/vector-icons';
import { isValidEmail } from '../utils/validation';
import { BackButton, CustomInput, PrimaryButton } from '../components/auth';
import { CustomToast } from '../components/feedback';
import { apiRequest } from '../services/api';
import { LanguageContext } from '../localization/LanguageContext';

import { palette } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [email, setEmail] = useState('');
  const { t } = useContext(LanguageContext);
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
    if (!email) return showToast(t('enterValidEmail'));
    if (!isValidEmail(email)) return showToast(t('enterValidEmail'));

    setIsLoading(true);
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }, null, 'Failed to send reset link');

      setIsSent(true);
    } catch (err) {
      showToast(err.message || t('somethingWentWrong'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEmailApp = () => {
    Linking.openURL('mailto:');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.formWrapper}>
            {!isSent ? (
              <>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.title}>{t('resetPasswordTitle')}</Text>
                <Text style={styles.subtitle}>{t('resetPasswordHint')}</Text>

                <CustomInput
                  label={t('email')}
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />

                <View style={styles.fullWidthButton}>
                  <PrimaryButton title={t('sendLink')} onPress={handleSendLink} isLoading={isLoading} />
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
                  <Text style={styles.linkText}>{t('backToSignIn')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.centerContent}>
                <View style={styles.iconCircle}>
                  <Ionicons name="mail-unread-outline" size={48} color={theme.textPrimary} />
                </View>

                <Text style={[styles.title, { textAlign: 'center' }]}>{t('checkYourEmail')}</Text>
                <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 24 }]}>
                  {t('resetLinkSent')}{'\n'}
                  <Text style={styles.emailValue}>{email}</Text>
                </Text>

                <View style={styles.fullWidthButton}>
                  <PrimaryButton title={t('openEmailApp')} onPress={handleOpenEmailApp} />
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
                  <Text style={styles.linkText}>{t('backToSignIn')}</Text>
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
