import React, { useContext, useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../hooks/useProfile';
import { LanguageContext } from '../localization/LanguageContext';
import { profileService } from '../services/profileService';
import { createUsernameAvailabilityController } from '../utils/username';
import { styles } from './UsernameSettingsScreen.styles';

const validationMessageKeys = {
  tooShort: 'usernameTooShort',
  tooLong: 'usernameTooLong',
  characters: 'usernameAllowedCharacters',
  reserved: 'usernameReserved',
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
      check: (value, { signal }) => profileService.checkUsername(value, userToken, signal),
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
      if (error.details?.code === 'USERNAME_ALREADY_EXISTS') controllerRef.current?.markTaken(username);
      else if (error.details?.code === 'USERNAME_RESERVED') setSaveError(t('usernameReserved'));
      else if (error.details?.code === 'INVALID_USERNAME') setSaveError(t('usernameInvalid'));
      else setSaveError(t('usernameSaveFailed'));
    }
  };

  const invalid = ['invalid', 'taken', 'error'].includes(availability.status);
  const helperText = saveError || (() => {
    if (availability.status === 'checking') return t('usernameChecking');
    if (availability.status === 'available') return t('usernameAvailable');
    if (availability.status === 'taken') return t('usernameTaken');
    if (availability.status === 'error') return t('usernameCheckFailed');
    if (availability.status === 'invalid') return t(validationMessageKeys[availability.reason] || 'usernameInvalid');
    return '';
  })();
  const helperColor = availability.status === 'available' ? theme.success : invalid || saveError ? theme.error : theme.textSecondary;
  const canSave = availability.status === 'available' && !isLoading;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('back')} onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons color={theme.textPrimary} name="arrow-back" size={24} />
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('usernameTitle')}</Text>
        <Pressable accessibilityLabel={t('saveUsername')} accessibilityRole="button" disabled={!canSave} onPress={handleSave} style={styles.headerButton}>
          <Ionicons color={canSave ? theme.primary : theme.textSecondary} name="checkmark" size={27} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('usernameSubtitle')}</Text>
        <TextInput
          accessibilityLabel={t('username')}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={handleChange}
          placeholder={t('usernamePlaceholder')}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.primary}
          style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: invalid ? theme.error : theme.border, color: theme.textPrimary }]}
          textContentType="username"
          value={username}
        />
        {!!helperText && <Text accessibilityRole={invalid ? 'alert' : undefined} style={[styles.helper, { color: helperColor }]}>{helperText}</Text>}
        <Text style={[styles.description, { color: theme.textSecondary }]}>{t('usernameDescription')}</Text>
      </View>
    </SafeAreaView>
  );
}
