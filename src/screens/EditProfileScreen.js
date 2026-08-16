import React, { useContext } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useProfile } from '../hooks/useProfile';
import { useProfileForm } from '../hooks/useProfileForm';

const Field = ({ label, value, onChangeText, theme, keyboardType = 'default' }) => <View style={styles.field}><Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text><TextInput keyboardType={keyboardType} onChangeText={onChangeText} style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]} value={value} /></View>;

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

  return <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={styles.header}><Pressable accessibilityLabel={t('back')} onPress={() => navigation.goBack()} style={styles.back}><Text style={[styles.backText, { color: theme.textPrimary }]}>‹</Text></Pressable><Text style={[styles.title, { color: theme.textPrimary }]}>{t('editProfile')}</Text></View>
    <View style={styles.content}>
      <Field label={t('name')} value={form.username} onChangeText={setField('username')} theme={theme} />
      <Field label={t('email')} value={form.email} onChangeText={setField('email')} theme={theme} keyboardType="email-address" />
      <Field label={t('age')} value={form.age} onChangeText={setField('age')} theme={theme} keyboardType="numeric" />
      <Field label={t('height')} value={form.height} onChangeText={setField('height')} theme={theme} keyboardType="numeric" />
      <Field label={t('weight')} value={form.weight} onChangeText={setField('weight')} theme={theme} keyboardType="numeric" />
      <Text style={[styles.label, { color: theme.textSecondary }]}>{t('gender')}</Text>
      <View style={[styles.segment, { borderColor: theme.border }]}>{[{ value: 'female', label: `♀  ${t('female')}` }, { value: 'male', label: `♂  ${t('male')}` }].map((option) => <Pressable key={option.value} onPress={() => setField('gender')(option.value)} style={[styles.segmentItem, form.gender === option.value && { backgroundColor: theme.textPrimary }]}><Text style={{ color: form.gender === option.value ? theme.background : theme.textPrimary }}>{option.label}</Text></Pressable>)}</View>
      {error ? <Text style={[styles.error, { color: theme.error }]}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={isLoading} onPress={handleSave} style={[styles.save, { borderColor: theme.textPrimary }, isLoading && styles.disabled]}><Text style={{ color: theme.textPrimary }}>{isLoading ? t('saving') : t('confirmChanges')}</Text></Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { alignItems: 'center', flexDirection: 'row', minHeight: 56, paddingHorizontal: 14 }, back: { alignItems: 'center', height: 40, justifyContent: 'center', width: 32 }, backText: { fontSize: 32, fontWeight: '300' }, title: { fontSize: 14, fontWeight: '800', marginLeft: 10, textTransform: 'uppercase' }, content: { paddingHorizontal: 22, paddingTop: 12 }, field: { marginBottom: 10 }, label: { fontSize: 12, marginBottom: 5 }, input: { borderRadius: 8, borderWidth: 1, fontSize: 14, minHeight: 40, paddingHorizontal: 10 }, segment: { borderRadius: 8, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' }, segmentItem: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 30 }, error: { fontSize: 12, marginTop: 12 }, save: { alignItems: 'center', borderRadius: 8, borderWidth: 1, justifyContent: 'center', marginTop: 50, minHeight: 48 }, disabled: { opacity: 0.5 },
});
