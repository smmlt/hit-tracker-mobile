import React, { useContext } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const { error, isLoading, profile, save } = useProfile(true);
  const { form, setField, submit } = useProfileForm(profile, save);
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
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.error }]}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={isLoading} onPress={handleSave} style={[styles.save, { borderColor: theme.textPrimary }, isLoading && styles.disabled]}>
          <Text style={[styles.saveText, { color: theme.textPrimary }]}>{isLoading ? t('saving') : t('confirmChanges')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
