import React, { useContext } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { palette } from '../constants/colors';

export default function ProfileScreen({ navigation }) {
  const { userData } = useContext(AuthContext);
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const name = userData?.fullName || userData?.name || userData?.email?.split('@')[0] || t('user');
  const email = userData?.email || '';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}> 
      <View style={styles.header}>
        <View style={styles.headerButton} />
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('profile')}</Text>
        <Pressable accessibilityLabel={t('settings')} onPress={() => navigation.navigate('Settings')} style={styles.headerButton}>
          <Text style={[styles.gear, { color: theme.textPrimary }]}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={[styles.avatar, { backgroundColor: palette.gray }]} />
        <Text style={[styles.name, { color: theme.textPrimary }]}>{name}</Text>
        <Text style={[styles.email, { color: theme.textSecondary }]}>{email}</Text>
        <View style={[styles.goal, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.goalText, { color: theme.textPrimary }]}>▧  {t('currentGoal')}: {userData?.goal || t('hypertrophy')}</Text>
          <View style={[styles.goalProgress, { backgroundColor: theme.primary }]} />
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('EditProfile')} style={[styles.outlineButton, { borderColor: theme.textPrimary }]}>
        <Text style={[styles.buttonText, { color: theme.textPrimary }]}>{t('editProfile')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 14 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 56 },
  headerButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  gear: { fontSize: 22 },
  title: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
  content: { alignItems: 'center', paddingTop: 12 },
  avatar: { borderRadius: 74, height: 148, width: 148 },
  name: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  email: { fontSize: 13, marginTop: 1 },
  goal: { borderRadius: 6, borderWidth: 1, marginTop: 28, overflow: 'hidden', paddingHorizontal: 12, paddingTop: 10, width: 180 },
  goalText: { fontSize: 11, fontWeight: '700' },
  goalProgress: { height: 3, marginTop: 7, width: 42 },
  outlineButton: { alignItems: 'center', borderRadius: 8, borderWidth: 1, marginTop: 70, minHeight: 48, justifyContent: 'center' },
  buttonText: { fontSize: 14 },
});
