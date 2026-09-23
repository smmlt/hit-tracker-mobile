import React, { useContext, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ConfirmDialog } from '../components/feedback';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useProfile } from '../hooks/useProfile';
import { useProfileForm } from '../hooks/useProfileForm';
import { styles } from './EditProfileScreen.styles';

const Field = ({ label, value, onChangeText, theme, keyboardType = 'default' }) => (
  <View style={styles.field}>
    <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    <TextInput keyboardType={keyboardType} onChangeText={onChangeText} style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]} value={value} />
  </View>
);

export default function EditProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const { error, isLoading, profile, removeAvatar, save, uploadAvatar } = useProfile(true);
  const { form, setField, submit } = useProfileForm(profile, save);
  const [pickerError, setPickerError] = useState('');
  const [removeAvatarOpen, setRemoveAvatarOpen] = useState(false);

  const pickAvatar = async () => {
    setPickerError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled) await uploadAvatar(result.assets[0]);
    } catch (requestError) {
      setPickerError(requestError.message || t('avatarPickerError'));
    }
  };

  const confirmRemoveAvatar = async () => {
    if (isLoading) return;
    try {
      await removeAvatar();
      setRemoveAvatarOpen(false);
    } catch (_) {}
  };
  const handleSave = async () => {
    try {
      await submit();
      navigation.goBack();
    } catch (_) {}
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('back')} onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons color={theme.textPrimary} name="arrow-back" size={24} />
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('editProfile')}</Text>
        <View style={styles.headerButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: theme.mediaPlaceholder }]}>
            {profile?.avatarUrl ? (
              <Image accessibilityLabel={t('profilePhoto')} source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons color={theme.textSecondary} name="person" size={50} />
            )}
            {isLoading ? <ActivityIndicator color={theme.primary} size="large" style={[styles.avatarLoading, { backgroundColor: theme.overlay }]} /> : null}
          </View>
          <Pressable
            accessibilityLabel={t('changePhoto')}
            accessibilityRole="button"
            disabled={isLoading}
            onPress={pickAvatar}
            style={[styles.avatarButton, { borderColor: theme.primary }, isLoading && styles.disabled]}
          >
            <Ionicons color={theme.primary} name="images-outline" size={19} />
            <Text style={[styles.avatarButtonText, { color: theme.primary }]}>{t('changePhoto')}</Text>
          </Pressable>
          {profile?.avatarUrl ? (
            <Pressable
              accessibilityRole="button"
              disabled={isLoading}
              onPress={() => setRemoveAvatarOpen(true)}
              style={styles.removeAvatarButton}
            >
              <Text style={[styles.removeAvatarText, { color: theme.error }]}>{t('removePhoto')}</Text>
            </Pressable>
          ) : null}
        </View>
        <Field label={t('name')} value={form.displayName} onChangeText={setField('displayName')} theme={theme} />
        <Pressable accessibilityRole="button" onPress={() => navigation.push('UsernameSettings')} style={styles.usernameRow}>
          <View style={styles.usernameContent}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{t('username')}</Text>
            <Text style={[styles.usernameValue, { borderBottomColor: theme.border, color: theme.textPrimary }]}>{profile?.username ? `@${profile.username}` : t('usernameNotSet')}</Text>
          </View>
          <Ionicons color={theme.textSecondary} name="chevron-forward" size={21} />
        </Pressable>
        <Field label={t('email')} value={form.email} onChangeText={setField('email')} theme={theme} keyboardType="email-address" />
        <Field label={t('age')} value={form.age} onChangeText={setField('age')} theme={theme} keyboardType="numeric" />
        <Field label={t('height')} value={form.height} onChangeText={setField('height')} theme={theme} keyboardType="numeric" />
        <Field label={t('weight')} value={form.weight} onChangeText={setField('weight')} theme={theme} keyboardType="numeric" />
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('gender')}</Text>
        <View style={[styles.segment, { backgroundColor: theme.surfaceElevated }]}>
          {[{ value: 'female', label: `♀  ${t('female')}` }, { value: 'male', label: `♂  ${t('male')}` }].map((option) => (
            <Pressable key={option.value} onPress={() => setField('gender')(option.value)} style={[styles.segmentItem, form.gender === option.value && { backgroundColor: theme.primary }]}>
              <Text style={[styles.segmentText, { color: theme.textPrimary }]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        {error || pickerError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.error }]}>{error || pickerError}</Text> : null}
        <Pressable accessibilityRole="button" disabled={isLoading} onPress={handleSave} style={[styles.save, { borderColor: theme.textPrimary }, isLoading && styles.disabled]}>
          <Text style={[styles.saveText, { color: theme.textPrimary }]}>{isLoading ? t('saving') : t('confirmChanges')}</Text>
        </Pressable>
      </ScrollView>
      <ConfirmDialog
        visible={removeAvatarOpen}
        title={t('removePhotoTitle')}
        message={t('removePhotoMessage')}
        confirmLabel={t('remove')}
        cancelLabel={t('cancel')}
        onCancel={() => !isLoading && setRemoveAvatarOpen(false)}
        onConfirm={confirmRemoveAvatar}
      />
    </SafeAreaView>
  );
}
