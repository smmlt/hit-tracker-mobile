import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/workshop/ui';
import { createStyles } from './AccountSuspendedScreen.styles';

export default function AccountSuspendedScreen() {
  const { accountSuspension, dismissAccountSuspension } = useContext(AuthContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const expiresAt = accountSuspension?.expiresAt
    ? new Date(accountSuspension.expiresAt).toLocaleString(locale === 'uk' ? 'uk-UA' : 'en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : t('notSpecified');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{t('accountSuspendedEyebrow')}</Text>
        <Text style={styles.title}>{t('accountSuspendedTitle')}</Text>
        <Text style={styles.message}>{t('accountSuspendedMessage')}</Text>
        <View style={styles.detail}>
          <Text style={styles.label}>{t('suspendedUntil')}</Text>
          <Text style={styles.value}>{expiresAt}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.label}>{t('suspensionReason')}</Text>
          <Text style={styles.value}>{accountSuspension?.reason || t('notSpecified')}</Text>
        </View>
        <Text style={styles.hint}>{t('accountSuspendedHint')}</Text>
        <Button onPress={dismissAccountSuspension}>{t('backToSignIn')}</Button>
      </View>
    </SafeAreaView>
  );
}
