import React, { useContext, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';

const Field = ({ label, value, onChangeText, theme, keyboardType = 'default' }) => <View style={styles.field}><Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text><TextInput keyboardType={keyboardType} onChangeText={onChangeText} style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]} value={value} /></View>;

export default function EditProfileScreen({ navigation }) {
  const { updateUserData, userData } = useContext(AuthContext);
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const [form, setForm] = useState({
    fullName: userData?.fullName || userData?.name || '', email: userData?.email || '', age: userData?.age || '', height: userData?.height || '', weight: userData?.weight || '', gender: userData?.gender || 'female',
  });
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => { await updateUserData({ ...userData, ...form }); navigation.goBack(); };

  return <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={styles.header}><Pressable accessibilityLabel={t('back')} onPress={() => navigation.goBack()} style={styles.back}><Text style={[styles.backText, { color: theme.textPrimary }]}>‹</Text></Pressable><Text style={[styles.title, { color: theme.textPrimary }]}>{t('editProfile')}</Text></View>
    <View style={styles.content}>
      <Field label={t('name')} value={form.fullName} onChangeText={set('fullName')} theme={theme} />
      <Field label={t('email')} value={form.email} onChangeText={set('email')} theme={theme} keyboardType="email-address" />
      <Field label={t('age')} value={String(form.age)} onChangeText={set('age')} theme={theme} keyboardType="numeric" />
      <Field label={t('height')} value={String(form.height)} onChangeText={set('height')} theme={theme} keyboardType="numeric" />
      <Field label={t('weight')} value={String(form.weight)} onChangeText={set('weight')} theme={theme} keyboardType="numeric" />
      <Text style={[styles.label, { color: theme.textSecondary }]}>{t('gender')}</Text>
      <View style={[styles.segment, { borderColor: theme.border }]}>{[{ value: 'female', label: `♀  ${t('female')}` }, { value: 'male', label: `♂  ${t('male')}` }].map((option) => <Pressable key={option.value} onPress={() => set('gender')(option.value)} style={[styles.segmentItem, form.gender === option.value && { backgroundColor: theme.textPrimary }]}><Text style={{ color: form.gender === option.value ? theme.background : theme.textPrimary }}>{option.label}</Text></Pressable>)}</View>
      <Pressable accessibilityRole="button" onPress={save} style={[styles.save, { borderColor: theme.textPrimary }]}><Text style={{ color: theme.textPrimary }}>{t('confirmChanges')}</Text></Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { alignItems: 'center', flexDirection: 'row', minHeight: 56, paddingHorizontal: 14 }, back: { alignItems: 'center', height: 40, justifyContent: 'center', width: 32 }, backText: { fontSize: 32, fontWeight: '300' }, title: { fontSize: 14, fontWeight: '800', marginLeft: 10, textTransform: 'uppercase' }, content: { paddingHorizontal: 22, paddingTop: 12 }, field: { marginBottom: 10 }, label: { fontSize: 12, marginBottom: 5 }, input: { borderRadius: 8, borderWidth: 1, fontSize: 14, minHeight: 40, paddingHorizontal: 10 }, segment: { borderRadius: 8, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' }, segmentItem: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 30 }, save: { alignItems: 'center', borderRadius: 8, borderWidth: 1, justifyContent: 'center', marginTop: 50, minHeight: 48 },
});
