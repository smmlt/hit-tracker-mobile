import React, { useContext, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';

const Toggle = ({ label, value, onChange, theme }) => (
  <View style={styles.row}>
    <Text style={[styles.rowText, { color: theme.textPrimary }]}>{label}</Text>
    <Switch accessibilityLabel={label} onValueChange={onChange} thumbColor={theme.textPrimary} trackColor={{ false: theme.border, true: theme.primary }} value={value} />
  </View>
);

const Choice = ({ label, options, value, onChange, theme }) => (
  <View style={styles.choiceRow}>
    <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    <View style={[styles.segment, { borderColor: theme.border }]}>
      {options.map((option) => <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.segmentItem, value === option.value && { backgroundColor: theme.textPrimary }]}>
        <Text style={[styles.segmentText, { color: value === option.value ? theme.background : theme.textPrimary }]}>{option.label}</Text>
      </Pressable>)}
    </View>
  </View>
);

export default function SettingsScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const { theme, themeName, toggleTheme } = useTheme();
  const { changeLanguage, locale, t } = useContext(LanguageContext);
  const [notifications, setNotifications] = useState({ general: true, workout: true, measurements: true, achievements: true, news: true });
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');

  const setNotification = (key) => (value) => setNotifications((current) => ({ ...current, [key]: value }));
  const handleLogout = async () => { await logout(); };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}> 
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('back')} onPress={() => navigation.goBack()} style={styles.back}><Text style={[styles.backText, { color: theme.textPrimary }]}>‹</Text></Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('settings')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('language')}</Text>
        <Choice label="" options={[{ value: 'uk', label: t('ukrainian') }, { value: 'en', label: t('english') }]} value={locale} onChange={changeLanguage} theme={theme} />
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('theme')}</Text>
        <Choice label="" options={[{ value: 'light', label: `☼  ${t('light')}` }, { value: 'dark', label: `☾  ${t('dark')}` }]} value={themeName} onChange={toggleTheme} theme={theme} />
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('notifications')}</Text>
        <Toggle label={t('generalNotifications')} value={notifications.general} onChange={setNotification('general')} theme={theme} />
        <Toggle label={t('workoutReminders')} value={notifications.workout} onChange={setNotification('workout')} theme={theme} />
        <Toggle label={t('measurementReminders')} value={notifications.measurements} onChange={setNotification('measurements')} theme={theme} />
        <Toggle label={t('achievementReminders')} value={notifications.achievements} onChange={setNotification('achievements')} theme={theme} />
        <Toggle label={t('programNews')} value={notifications.news} onChange={setNotification('news')} theme={theme} />
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('units')}</Text>
        <Choice label={t('weight')} options={[{ value: 'kg', label: t('kilograms') }, { value: 'lb', label: t('pounds') }]} value={weightUnit} onChange={setWeightUnit} theme={theme} />
        <Choice label={t('height')} options={[{ value: 'cm', label: t('centimeters') }, { value: 'ft', label: t('feet') }]} value={heightUnit} onChange={setHeightUnit} theme={theme} />
        <Pressable accessibilityRole="button" onPress={handleLogout} style={[styles.logout, { borderColor: theme.primary }]}><Text style={[styles.logoutText, { color: theme.primary }]}>{t('logout')}</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 56, paddingHorizontal: 14 },
  back: { alignItems: 'center', height: 40, justifyContent: 'center', width: 32 },
  backText: { fontSize: 32, fontWeight: '300' },
  title: { fontSize: 14, fontWeight: '800', marginLeft: 10, textTransform: 'uppercase' },
  content: { paddingHorizontal: 22, paddingBottom: 34 },
  label: { fontSize: 12, marginBottom: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 14 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rowText: { fontSize: 14 },
  choiceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  segment: { borderRadius: 8, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  segmentItem: { alignItems: 'center', justifyContent: 'center', minHeight: 30, paddingHorizontal: 12 },
  segmentText: { fontSize: 12 },
  logout: { alignItems: 'center', borderRadius: 8, borderWidth: 1, justifyContent: 'center', marginTop: 28, minHeight: 46 },
  logoutText: { fontSize: 14, fontWeight: '700' },
});
