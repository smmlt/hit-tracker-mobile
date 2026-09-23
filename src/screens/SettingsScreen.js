import React, { useContext, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './SettingsScreen.styles.js';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';

const Toggle = ({ label, value, onChange, theme }) => (
  <View style={styles.row}>
    <Text style={[styles.rowText, { color: theme.textPrimary }]}>{label}</Text>
    <Switch accessibilityLabel={label} onValueChange={onChange} thumbColor={theme.onPrimary} trackColor={{ false: theme.textSecondary, true: theme.primary }} value={value} />
  </View>
);

const Choice = ({ options, value, onChange, theme }) => (
  <View style={[styles.segment, { borderColor: theme.textPrimary }]}>
    {options.map((option) => {
      const selected = value === option.value;
      return (
        <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={option.value} onPress={() => onChange(option.value)} style={[styles.segmentItem, selected && { backgroundColor: theme.primary }]}>
          {option.icon ? <Ionicons color={selected ? theme.onPrimary : theme.textSecondary} name={option.icon} size={22} /> : null}
          <Text style={[styles.segmentText, { color: selected ? theme.onPrimary : theme.textSecondary }]}>{option.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

export default function SettingsScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const { theme, themeName, toggleTheme } = useTheme();
  const { changeLanguage, locale, t } = useContext(LanguageContext);
  const [notifications, setNotifications] = useState({ general: true, workout: true, measurements: false, achievements: true, news: true });
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');
  const setNotification = (key) => (value) => setNotifications((current) => ({ ...current, [key]: value }));

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel={t('back')} onPress={() => navigation.goBack()} style={styles.back}><Ionicons color={theme.textPrimary} name="arrow-back" size={24} /></Pressable>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{t('settings')}</Text>
        </View>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('language')}</Text>
        <Pressable accessibilityLabel={t('language')} accessibilityRole="button" onPress={() => changeLanguage(locale === 'uk' ? 'en' : 'uk')} style={[styles.languageField, { borderColor: theme.textPrimary }]}>
          <Text style={[styles.languageText, { color: theme.textPrimary }]}>{locale === 'uk' ? t('ukrainian') : t('english')}</Text>
          <Ionicons color={theme.textPrimary} name="chevron-down" size={22} />
        </Pressable>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('theme')}</Text>
        <Choice options={[{ value: 'light', label: t('light'), icon: 'sunny-outline' }, { value: 'dark', label: t('dark'), icon: 'moon' }]} value={themeName} onChange={toggleTheme} theme={theme} />
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('notifications')}</Text>
        <Toggle label={t('generalNotifications')} value={notifications.general} onChange={setNotification('general')} theme={theme} />
        <Toggle label={t('workoutReminders')} value={notifications.workout} onChange={setNotification('workout')} theme={theme} />
        <Toggle label={t('measurementReminders')} value={notifications.measurements} onChange={setNotification('measurements')} theme={theme} />
        <Toggle label={t('achievementReminders')} value={notifications.achievements} onChange={setNotification('achievements')} theme={theme} />
        <View style={[styles.reminderCard, { borderColor: theme.border }]}>
          <View style={styles.reminderBody}>
            <Text style={[styles.reminderLabel, { color: theme.textSecondary }]}>{t('reminderTime')}</Text>
            <Text style={[styles.reminderValue, { color: theme.textPrimary }]}>{t('reminderSchedule')}</Text>
          </View>
          <Ionicons color={theme.textPrimary} name="chevron-down" size={22} />
        </View>
        <Toggle label={t('programNews')} value={notifications.news} onChange={setNotification('news')} theme={theme} />
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('units')}</Text>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('weight')}</Text>
        <Choice options={[{ value: 'kg', label: t('kilograms') }, { value: 'lb', label: t('pounds') }]} value={weightUnit} onChange={setWeightUnit} theme={theme} />
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('height')}</Text>
        <Choice options={[{ value: 'cm', label: t('centimeters') }, { value: 'ft', label: t('feet') }]} value={heightUnit} onChange={setHeightUnit} theme={theme} />
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={[styles.save, { borderColor: theme.primary }]}><Text style={[styles.saveText, { color: theme.textPrimary }]}>{t('save')}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={logout} style={styles.logout}><Text style={[styles.logoutText, { color: theme.primary }]}>{t('logout')}</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
