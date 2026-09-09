import React, { useContext, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BackButton } from '../components/auth';
import { CustomToast } from '../components/feedback';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { completeVerification } from '../utils/authFlow';

export default function VerifyEmailScreen({ navigation, route }) {
  const [code, setCode] = useState('');
  const [codeState, setCodeState] = useState('idle');
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const [codeLocked, setCodeLocked] = useState(false);
  const { verifyRegistration, isLoading } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [storedEmail, setStoredEmail] = useState('');
  const email = route.params?.email || storedEmail;
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const codeInputRef = useRef(null);
  const [codeInputFocused, setCodeInputFocused] = useState(false);
  const submittingRef = useRef(false);
  const toastTimerRef = useRef();
  const lastSubmittedCodeRef = useRef('');

  React.useEffect(() => {
    AsyncStorage.getItem('pendingRegistrationEmail').then((value) => setStoredEmail(value || ''));
  }, []);

  const hideToast = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
      .start(() => setToastVisible(false));
  };

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(hideToast, 3500);
  };

  React.useEffect(() => () => {
    clearTimeout(toastTimerRef.current);
    fadeAnim.stopAnimation();
  }, [fadeAnim]);

  React.useEffect(() => {
    if (!retryAfterSeconds) return undefined;
    const timer = setInterval(() => setRetryAfterSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [retryAfterSeconds]);

  const verificationErrorMessage = (error) => {
    switch (error.details?.code) {
      case 'INVALID_VERIFICATION_CODE':
        return t('invalidVerificationCode');
      case 'VERIFICATION_CODE_EXPIRED':
      case 'REGISTRATION_NOT_FOUND':
        return t('verificationCodeExpired');
      default:
        return error.message || t('verificationFailed');
    }
  };

  const handleVerify = async () => {
    if (submittingRef.current) return;
    if (!/^\d{6}$/.test(code)) {
      setCodeState('error');
      showToast(t('enterSixDigitCode'));
      return;
    }
    if (!email) {
      showToast(t('enterValidEmail'));
      return;
    }

    try {
      submittingRef.current = true;
      await completeVerification({
        code,
        email,
        verify: verifyRegistration,
        onVerified: async () => {
          setCodeState('success');
          await new Promise((resolve) => setTimeout(resolve, 350));
        },
        clearPendingEmail: () => AsyncStorage.removeItem('pendingRegistrationEmail'),
        navigate: (value) => navigation.replace('Login', { prefilledEmail: value, registered: true }),
      });
    } catch (error) {
      if (error.status === 429) {
        setCodeLocked(true);
        setAttemptsRemaining(null);
        setRetryAfterSeconds(error.details?.retryAfterSeconds || error.retryAfterSeconds || 30 * 60);
        return;
      }
      setAttemptsRemaining(error.details?.attemptsRemaining ?? null);
      setCodeState('error');
      showToast(verificationErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  };

  React.useEffect(() => {
    if (code.length < 6) {
      lastSubmittedCodeRef.current = '';
      return;
    }
    if (codeLocked || isLoading || lastSubmittedCodeRef.current === code) return;
    lastSubmittedCodeRef.current = code;
    handleVerify();
  }, [code, codeLocked, isLoading]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.formWrapper}>
            <Text style={styles.title}>{t('verifyEmail')}</Text>
            <Text style={styles.subtitle}>
              {t('verificationSent').replace('{email}', email || t('email'))}
            </Text>
            <TouchableOpacity
              accessibilityLabel={t('confirmationCode')}
              activeOpacity={1}
              onPress={() => codeInputRef.current?.focus()}
              style={styles.codeInputWrapper}
            >
              <View style={styles.codeCells} pointerEvents="none">
                {Array.from({ length: 6 }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.codeCell,
                      codeInputFocused && index === Math.min(code.length, 5) && styles.codeCellFocused,
                      codeState === 'error' && styles.codeCellError,
                      codeState === 'success' && styles.codeCellSuccess,
                    ]}
                  >
                    <Text style={styles.codeDigit}>{code[index] || ''}</Text>
                  </View>
                ))}
              </View>
              <TextInput
                ref={codeInputRef}
                value={code}
                onBlur={() => setCodeInputFocused(false)}
                onChangeText={(value) => {
                  setCodeState('idle');
                  setAttemptsRemaining(null);
                  setCode(value.replace(/\D/g, '').slice(0, 6));
                }}
                onFocus={() => setCodeInputFocused(true)}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                style={styles.hiddenCodeInput}
              />
            </TouchableOpacity>
            {isLoading && <Text style={styles.status}>{t('verifyingCode')}</Text>}
            {attemptsRemaining !== null && (
              <Text style={styles.warning}>{t('incorrectCodeRemaining').replace('{count}', attemptsRemaining)}</Text>
            )}
            {codeLocked && (
              <View style={styles.lockedBox}>
                <Text style={styles.warning}>
                  {t('tooManyCodes').replace('{seconds}', retryAfterSeconds)}
                </Text>
                {retryAfterSeconds === 0 && (
                  <TouchableOpacity onPress={() => navigation.replace('Register', { prefilledEmail: email })}>
                    <Text style={styles.requestCode}>{t('requestNewCode')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => navigation.replace('Register', { prefilledEmail: email })}
            style={styles.bottomLinkContainer}
          >
            <Text style={styles.bottomText}>{t('noEmailAccess')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomToast visible={toastVisible} message={toastMessage} type="error" variant="light" fadeAnim={fadeAnim} onClose={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { alignSelf: 'center', flexGrow: 1, maxWidth: 393, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 34, width: '100%' },
  formWrapper: { marginTop: 88, width: '100%' },
  title: { color: '#000', fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#666363', fontSize: 18, lineHeight: 23, marginBottom: 44 },
  codeInputWrapper: { height: 71, position: 'relative', width: '100%' },
  codeCells: { flexDirection: 'row', gap: 7, justifyContent: 'space-between', width: '100%' },
  codeCell: { alignItems: 'center', borderColor: '#7F7A7A', borderRadius: 10, borderWidth: 2, flex: 1, height: 71, justifyContent: 'center', maxWidth: 57 },
  codeCellFocused: { borderColor: '#1D1B20' },
  codeCellError: { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
  codeCellSuccess: { backgroundColor: '#ECFDF5', borderColor: '#059669' },
  codeDigit: { color: '#111827', fontSize: 28, fontWeight: '600' },
  hiddenCodeInput: { ...StyleSheet.absoluteFillObject, color: 'transparent', opacity: 0.01 },
  status: { color: '#7F7A7A', fontSize: 15, fontWeight: '700', marginTop: 24, textAlign: 'center' },
  warning: { color: '#DC2626', fontSize: 13, lineHeight: 18, marginTop: 10, textAlign: 'center' },
  lockedBox: { alignItems: 'center' },
  requestCode: { color: '#000', fontSize: 14, fontWeight: '700', marginTop: 12 },
  bottomLinkContainer: { alignItems: 'center', marginTop: 'auto', paddingTop: 48 },
  bottomText: { color: '#000', fontSize: 15, fontWeight: '700' },
});
