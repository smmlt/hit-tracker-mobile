/**
 * Verifies the multi-factor authentication code for the pending login, handling retry/error state before completing the AuthContext session transition. / Перевіряє код багатофакторної автентифікації для незавершеного входу, обробляє повтор і помилки перед завершенням переходу сесії через AuthContext.
 */
import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { CustomInput, PrimaryButton } from '../components/auth';
import { createStyles } from './MfaScreen.styles';

// EN: Renders either MFA enrollment or verification and hands the completed authenticated session back to AuthContext.
// UK: Показує enrollment або перевірку MFA та передає завершену автентифіковану сесію назад до AuthContext.
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

  useEffect(
    /* EN: Starts TOTP enrollment only when the pending login requires it and ignores results after the screen unmounts. */
    /* UK: Починає TOTP enrollment лише коли цього вимагає pending login, та ігнорує результат після unmount екрана. */
    () => {
      let active = true;
      if (!pendingMfa?.enrollmentRequired)
        return /* EN: Marks the no-enrollment effect inactive during cleanup. */ /* UK: Позначає effect без enrollment неактивним під час cleanup. */ () => {
          active = false;
        };
      beginMfaEnrollment()
      .then(
        /* EN: Stores the manual TOTP setup data only while this screen is still active. */
        /* UK: Зберігає дані ручного TOTP setup лише доки цей екран залишається активним. */
        (value) => {
          if (active) setSetup(value);
        }
      )
      .catch(
        /* EN: Converts an enrollment request failure into the localized screen error. */
        /* UK: Перетворює помилку enrollment-запиту на локалізоване повідомлення екрана. */
        () => {
          if (active) setError(t('mfaSetupFailed'));
        }
      )
      .finally(
        /* EN: Ends the loading state after either a successful or failed setup request. */
        /* UK: Завершує loading-стан після успішного або невдалого setup-запиту. */
        () => {
          if (active) setLoading(false);
        }
      );
      return /* EN: Prevents late asynchronous enrollment results from updating an unmounted screen. */ /* UK: Не дозволяє пізньому асинхронному результату enrollment оновити unmounted-екран. */ () => {
        active = false;
      };
    },
    [beginMfaEnrollment, pendingMfa?.enrollmentRequired]
  );

  // EN: Submits either the enrollment TOTP, a normal TOTP, or a recovery code and maps throttling to a distinct user message.
  // UK: Надсилає enrollment TOTP, звичайний TOTP або recovery-код і показує окреме повідомлення для throttling.
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

  // EN: Accepts the completed enrollment session only after the user confirms that the one-time recovery codes were saved.
  // UK: Приймає завершену enrollment-сесію лише після підтвердження, що одноразові recovery-коди збережено.
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
          <TouchableOpacity
            accessibilityRole="button"
            onPress={
              /* EN: Copies all newly issued recovery codes so the user can store them safely. */
              /* UK: Копіює всі щойно видані recovery-коди, щоб користувач міг безпечно їх зберегти. */
              () => Clipboard.setStringAsync(recoveryText)
            }
          >
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
            <TouchableOpacity
              accessibilityRole="button"
              onPress={
                /* EN: Copies the manual TOTP secret for authenticator apps that cannot scan the setup data. */
                /* UK: Копіює ручний TOTP secret для authenticator-застосунків, які не можуть зчитати setup-дані. */
                () => Clipboard.setStringAsync(setup.secret)
              }
            >
              <Text style={styles.link}>{t('copySecret')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {!pendingMfa?.enrollmentRequired && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={
              /* EN: Switches between TOTP and recovery-code input while clearing stale validation state. */
              /* UK: Перемикає введення між TOTP і recovery-кодом та очищає застарілий стан перевірки. */
              () => {
              setUseRecovery(!useRecovery);
              setCode('');
              setError('');
              }
            }
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
