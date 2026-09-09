import React, { useContext, useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../hooks/useProfile';
import { LanguageContext } from '../localization/LanguageContext';
import { profileService } from '../services/profileService';
import { createUsernameAvailabilityController } from '../utils/username';

const validationMessageKeys = {
  tooShort: 'usernameTooShort',
  tooLong: 'usernameTooLong',
  characters: 'usernameAllowedCharacters',
  edgeDot: 'usernameDotEdges',
  consecutiveDots: 'usernameConsecutiveDots',
};

export default function UsernameSettingsScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const { isLoading, profile, saveUsername } = useProfile(true);
  const [username, setUsername] = useState('');
  const [availability, setAvailability] = useState({ status: 'empty', username: '' });
  const [saveError, setSaveError] = useState('');
  const controllerRef = useRef(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    const controller = createUsernameAvailabilityController({
      delay: 400,
      check: (value, { signal }) =>
        profileService.checkUsername(value, userToken, signal),
      onState: setAvailability,
    });
    controllerRef.current = controller;
    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [userToken]);

  useEffect(() => {
    if (!profile || dirtyRef.current || !controllerRef.current) return;
    const initialUsername = profile.username || '';
    setUsername(initialUsername);
    controllerRef.current.update(initialUsername);
  }, [profile]);

  const handleChange = (value) => {
    dirtyRef.current = true;
    const normalizedValue = value.toLowerCase();
    setUsername(normalizedValue);
    setSaveError('');
    controllerRef.current?.update(normalizedValue);
  };

  const handleSave = async () => {
    if (availability.status !== 'available') return;
    try {
      setSaveError('');
      await saveUsername(availability.username);
      navigation.goBack();
    } catch (error) {
      if (error.details?.code === 'USERNAME_ALREADY_EXISTS') {
        controllerRef.current?.markTaken(username);
      } else if (error.details?.code === 'INVALID_USERNAME') {
        setSaveError(t('usernameInvalid'));
      } else {
        setSaveError(t('usernameSaveFailed'));
      }
    }
  };

  const invalid = ['invalid', 'taken', 'error'].includes(availability.status);
  const helperText = saveError || (() => {
    if (availability.status === 'checking') return t('usernameChecking');
    if (availability.status === 'available') return t('usernameAvailable');
    if (availability.status === 'taken') return t('usernameTaken');
    if (availability.status === 'error') return t('usernameCheckFailed');
    if (availability.status === 'invalid') {
      return t(validationMessageKeys[availability.reason] || 'usernameInvalid');
    }
    return t('usernameDescription');
  })();
  const helperColor = availability.status === 'available'
    ? theme.success
    : invalid || saveError
      ? theme.error
      : theme.textSecondary;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('back')} onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={[styles.backText, { color: theme.textPrimary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('usernameTitle')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('usernameSubtitle')}</Text>
        <TextInput
          accessibilityLabel={t('username')}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={handleChange}
          placeholder={t('usernamePlaceholder')}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.primary}
          style={[
            styles.input,
            {
              backgroundColor: theme.cardBackground,
              borderColor: invalid ? theme.error : theme.border,
              color: theme.textPrimary,
            },
          ]}
          textContentType="username"
          value={username}
        />
        <Text accessibilityRole={invalid ? 'alert' : undefined} style={[styles.helper, { color: helperColor }]}>
          {helperText}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: availability.status !== 'available' || isLoading }}
          disabled={availability.status !== 'available' || isLoading}
          onPress={handleSave}
          style={[
            styles.save,
            { backgroundColor: theme.primary },
            (availability.status !== 'available' || isLoading) && styles.disabled,
          ]}
        >
          <Text style={styles.saveText}>{isLoading ? t('saving') : t('saveUsername')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 56, paddingHorizontal: 14 },
  back: { alignItems: 'center', height: 40, justifyContent: 'center', width: 32 },
  backText: { fontSize: 32, fontWeight: '300' },
  title: { fontSize: 14, fontWeight: '800', marginLeft: 10, textTransform: 'uppercase' },
  content: { paddingHorizontal: 22, paddingTop: 18 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 18 },
  input: { borderRadius: 8, borderWidth: 1, fontSize: 16, minHeight: 48, paddingHorizontal: 12 },
  helper: { fontSize: 12, lineHeight: 18, marginTop: 8, minHeight: 36 },
  save: { alignItems: 'center', borderRadius: 8, justifyContent: 'center', marginTop: 24, minHeight: 48 },
  saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.45 },
});
