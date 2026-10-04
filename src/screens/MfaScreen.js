import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { CustomInput, PrimaryButton } from '../components/auth';
import { createStyles } from './MfaScreen.styles';

export default function MfaScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { t } = useContext(LanguageContext);
  const { pendingMfa, beginMfaEnrollment, confirmMfaEnrollment, acceptMfaSession, verifyMfa, cancelMfa } = useContext(AuthContext);
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [completedSession, setCompletedSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(pendingMfa?.enrollmentRequired));
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!pendingMfa?.enrollmentRequired)
      return () => {
        active = false;
      };
    beginMfaEnrollment()
      .then((value) => {
        if (active) setSetup(value);
      })
      .catch(() => {
        if (active) setError(t('mfaSetupFailed'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [beginMfaEnrollment, pendingMfa?.enrollmentRequired]);

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      if (pendingMfa.enrollmentRequired) {
        const data = await confirmMfaEnrollment(code.trim());
        setRecoveryCodes(data.recoveryCodes);
        setCompletedSession(data);
      } else {
        await verifyMfa(useRecovery ? { recoveryCode: code.trim() } : { code: code.trim() });
      }
    } catch (requestError) {
      if (requestError.status === 429) setError(t('mfaTooManyAttempts'));
      else setError(t('mfaInvalidCode'));
    } finally {
      setLoading(false);
    }
  };

  const finishEnrollment = async () => {
    setLoading(true);
    try {
      await acceptMfaSession(completedSession);
    } finally {
      setLoading(false);
    }
  };

  if (recoveryCodes) {
    const recoveryText = recoveryCodes.join('\n');
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>{t('mfaRecoveryTitle')}</Text>
          <Text style={styles.subtitle}>{t('mfaRecoveryHint')}</Text>
          <Text selectable style={styles.secret}>
            {recoveryText}
          </Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => Clipboard.setStringAsync(recoveryText)}>
            <Text style={styles.link}>{t('copyRecoveryCodes')}</Text>
          </TouchableOpacity>
          <PrimaryButton title={t('savedRecoveryCodes')} onPress={finishEnrollment} isLoading={loading} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{pendingMfa?.enrollmentRequired ? t('mfaSetupTitle') : t('mfaVerifyTitle')}</Text>
        <Text style={styles.subtitle}>{pendingMfa?.enrollmentRequired ? t('mfaSetupHint') : t('mfaVerifyHint')}</Text>
        {setup && (
          <View style={styles.setupCard}>
            <Text style={styles.label}>{t('mfaManualSecret')}</Text>
            <Text selectable style={styles.secret}>
              {setup.secret}
            </Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => Clipboard.setStringAsync(setup.secret)}>
              <Text style={styles.link}>{t('copySecret')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {!pendingMfa?.enrollmentRequired && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              setUseRecovery(!useRecovery);
              setCode('');
              setError('');
            }}
          >
            <Text style={styles.link}>{useRecovery ? t('useAuthenticatorCode') : t('useRecoveryCode')}</Text>
          </TouchableOpacity>
        )}
        <CustomInput
          label={useRecovery ? t('recoveryCode') : t('authenticatorCode')}
          value={code}
          onChangeText={setCode}
          keyboardType={useRecovery ? 'default' : 'number-pad'}
          maxLength={useRecovery ? 24 : 6}
          autoComplete="one-time-code"
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <PrimaryButton
          title={pendingMfa?.enrollmentRequired ? t('enableMfa') : t('verify')}
          onPress={submit}
          isLoading={loading}
          disabled={loading || (useRecovery ? code.trim().length < 16 : !/^\d{6}$/.test(code.trim()))}
        />
        <TouchableOpacity accessibilityRole="button" onPress={cancelMfa} style={styles.cancel}>
          <Text style={styles.link}>{t('cancel')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
