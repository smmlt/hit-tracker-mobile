import React, { useContext, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BackButton, CustomInput, PrimaryButton } from '../components/auth';
import { CustomToast } from '../components/feedback';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';

export default function VerifyEmailScreen({ navigation, route }) {
  const [code, setCode] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const [codeLocked, setCodeLocked] = useState(false);
  const { verifyRegistration, isLoading } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
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

  React.useEffect(() => {
    if (!retryAfterSeconds) return undefined;
    const timer = setInterval(() => setRetryAfterSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [retryAfterSeconds]);

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      showToast(t('enterSixDigitCode'));
      return;
    }

    try {
      await verifyRegistration(email, code);
    } catch (error) {
      if (error.status === 429) {
        setCodeLocked(true);
        setAttemptsRemaining(null);
        setRetryAfterSeconds(error.details?.retryAfterSeconds || error.retryAfterSeconds || 30 * 60);
        return;
      }
      setAttemptsRemaining(error.details?.attemptsRemaining ?? null);
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
              {t('verificationSent').replace('{email}', email || t('email'))}
            </Text>
            <CustomInput
              label={t('confirmationCode')}
              placeholder="000000"
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
            />
            <PrimaryButton
              title={codeLocked ? t('codeLocked') : t('verifyAndCreate')}
              onPress={handleVerify}
              isLoading={isLoading}
              disabled={codeLocked}
            />
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
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.bottomLinkContainer}>
              <Text style={styles.bottomText}>{t('alreadyHaveAccount')} <Text style={styles.boldText}>{t('signIn')}</Text></Text>
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
  warning: { color: '#DC2626', fontSize: 13, lineHeight: 18, marginTop: 10, textAlign: 'center' },
  lockedBox: { alignItems: 'center' },
  requestCode: { color: '#000', fontSize: 14, fontWeight: '700', marginTop: 12 },
  bottomLinkContainer: { alignItems: 'center', marginTop: 28 },
  bottomText: { color: '#6B7280', fontSize: 14 },
  boldText: { color: '#000', fontWeight: '700' },
});
