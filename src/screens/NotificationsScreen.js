import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { notificationService } from '../services/notificationService';
import { createStyles } from './NotificationsScreen.styles';

export default function NotificationsScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [data, setData] = useState({ items: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await notificationService.list(userToken));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  useEffect(() => { void load(); }, [load]);

  const markRead = async (item) => {
    if (item.readAt) return;
    setData((current) => ({
      ...current,
      unreadCount: Math.max(0, current.unreadCount - 1),
      items: current.items.map((entry) => entry.id === item.id
        ? { ...entry, readAt: new Date().toISOString() }
        : entry),
    }));
    try {
      await notificationService.markRead(item.id, userToken);
    } catch (requestError) {
      setError(requestError.message);
      void load();
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead(userToken);
      const now = new Date().toISOString();
      setData((current) => ({
        ...current,
        unreadCount: 0,
        items: current.items.map((item) => ({ ...item, readAt: item.readAt || now })),
      }));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('back')} onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons color={theme.textPrimary} name="arrow-back" size={24} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('notificationInbox')}</Text>
          <Text style={styles.subtitle}>{t('unreadNotifications', { count: data.unreadCount || 0 })}</Text>
        </View>
        <Pressable accessibilityRole="button" disabled={!data.unreadCount} onPress={markAllRead} style={styles.markAll}>
          <Text style={[styles.markAllText, !data.unreadCount && styles.disabled]}>{t('markAllRead')}</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={theme.primary} style={styles.loading} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={theme.primary} />}
        >
          {!!error && (
            <Pressable accessibilityRole="button" onPress={load} style={styles.errorCard}>
              <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
              <Text style={styles.retry}>{t('retry')}</Text>
            </Pressable>
          )}
          {!data.items.length && !error ? <Text style={styles.empty}>{t('noNotifications')}</Text> : null}
          {data.items.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.id}
              onPress={() => {
                void markRead(item);
                if (item.payload?.actionUrl?.startsWith('https://')) void Linking.openURL(item.payload.actionUrl);
              }}
              style={[styles.card, !item.readAt && styles.unreadCard]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.category}>{t(`notificationCategory_${item.category}`)}</Text>
                {!item.readAt ? <View accessibilityLabel={t('unread')} style={styles.unreadDot} /> : null}
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              {item.payload?.imageUrl?.startsWith('https://') ? (
                <Image accessibilityLabel={item.title} source={{ uri: item.payload.imageUrl }} style={styles.image} />
              ) : null}
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleString(locale)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
