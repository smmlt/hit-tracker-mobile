import React, { useContext, useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useProfile } from '../hooks/useProfile';
import { UsernameActionsMenu } from '../components/profile/UsernameActionsMenu';
import { styles } from './ProfileScreen.styles';

export default function ProfileScreen({ navigation }) {
  const { profile: userData } = useProfile(true);
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const [menuVisible, setMenuVisible] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const copyTimerRef = useRef(null);
  const name = userData?.displayName || userData?.username || t('user');
  const username = userData?.username ? `@${userData.username}` : t('usernameNotSet');

  const showCopyMessage = (message) => {
    setCopyMessage(message);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyMessage(''), 2200);
  };

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerButton} />
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('profile')}</Text>
        <Pressable accessibilityLabel={t('settings')} onPress={() => navigation.navigate('Settings')} style={styles.headerButton}>
          <Ionicons color={theme.textPrimary} name="settings-outline" size={23} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <View style={[styles.avatar, { backgroundColor: theme.surfaceElevated }]} />
        <Text style={[styles.name, { color: theme.textPrimary }]}>{name}</Text>
        <Pressable accessibilityLabel={t('username')} accessibilityRole="button" disabled={!userData?.username} onPress={() => setMenuVisible(true)} style={styles.usernameButton}>
          <Text style={[styles.username, { color: theme.textSecondary }]}>{username}</Text>
        </Pressable>
        <View style={[styles.goal, { backgroundColor: theme.surfaceElevated }]}>
          <Text style={[styles.goalText, { color: theme.textPrimary }]}>▧  {t('currentGoal')}: {userData?.goal || t('hypertrophy')}</Text>
          <View style={[styles.goalProgress, { backgroundColor: theme.primary }]} />
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('EditProfile')} style={[styles.outlineButton, { borderColor: theme.textPrimary }]}>
        <Text style={[styles.buttonText, { color: theme.textPrimary }]}>{t('editProfile')}</Text>
      </Pressable>
      {!!copyMessage && <Text accessibilityRole="alert" style={[styles.toast, { backgroundColor: theme.surfaceElevated, color: theme.textPrimary }]}>{copyMessage}</Text>}
      <UsernameActionsMenu
        isOwner
        onClose={() => setMenuVisible(false)}
        onCopyResult={showCopyMessage}
        onEdit={() => { setMenuVisible(false); navigation.push('UsernameSettings'); }}
        username={userData?.username || ''}
        visible={menuVisible}
      />
    </SafeAreaView>
  );
}
