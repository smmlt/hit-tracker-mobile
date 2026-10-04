import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { notificationService } from '../services/notificationService';
import { getYouTubeThumbnailUrl } from '../utils/media';
import { safeNotificationUrl } from '../utils/safeNotificationUrl';
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

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (item) => {
    if (item.readAt) return;
    setData((current) => ({
      ...current,
      unreadCount: Math.max(0, current.unreadCount - 1),
      items: current.items.map((entry) => (entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry)),
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
        items: current.items.map((item) => ({
          ...item,
          readAt: item.readAt || now,
        })),
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
        <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={theme.primary} />}>
          {!!error && (
            <Pressable accessibilityRole="button" onPress={load} style={styles.errorCard}>
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
              <Text style={styles.retry}>{t('retry')}</Text>
            </Pressable>
          )}
          {!data.items.length && !error ? <Text style={styles.empty}>{t('noNotifications')}</Text> : null}
          {data.items.map((item) => {
            const videoUrls = (item.videoUrls?.length ? item.videoUrls : item.payload?.videoUrls?.length ? item.payload.videoUrls : item.payload?.videoUrl ? [item.payload.videoUrl] : [])
              .map(safeNotificationUrl)
              .filter(Boolean);
            const imageUrls = (item.imageUrls?.length ? item.imageUrls : item.payload?.imageUrls?.length ? item.payload.imageUrls : item.payload?.imageUrl ? [item.payload.imageUrl] : []).filter(
              (url) => url?.startsWith('https://'),
            );
            const explicitActionUrl = safeNotificationUrl(item.payload?.actionUrl);
            const actionUrl = explicitActionUrl || videoUrls[0] || null;
            return (
              <Pressable
                accessibilityRole="button"
                key={item.id}
                onPress={() => {
                  void markRead(item);
                  if (actionUrl) void Linking.openURL(actionUrl);
                }}
                style={[styles.card, !item.readAt && styles.unreadCard]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.category}>{t(`notificationCategory_${item.category}`)}</Text>
                  {!item.readAt ? <View accessibilityLabel={t('unread')} style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                {!!imageUrls.length && (
                  <ScrollView horizontal contentContainerStyle={styles.mediaRow} showsHorizontalScrollIndicator={false}>
                    {imageUrls.map((url) => (
                      <Image accessibilityLabel={item.title} key={url} source={{ uri: url }} style={styles.galleryImage} />
                    ))}
                  </ScrollView>
                )}
                {!!videoUrls.length && (
                  <ScrollView horizontal contentContainerStyle={styles.mediaRow} showsHorizontalScrollIndicator={false}>
                    {videoUrls.map((url) => (
                      <Pressable
                        accessibilityLabel={t('notificationWatchVideo')}
                        accessibilityRole="link"
                        key={url}
                        onPress={(event) => {
                          event?.stopPropagation?.();
                          void Linking.openURL(url);
                        }}
                        style={styles.videoCard}
                      >
                        {getYouTubeThumbnailUrl(url) ? <Image source={{ uri: getYouTubeThumbnailUrl(url) }} style={styles.videoImage} /> : null}
                        <View style={styles.videoLink}>
                          <Ionicons color={theme.primary} name="play-circle-outline" size={18} />
                          <Text numberOfLines={1} style={styles.videoLinkText}>
                            {t('notificationWatchVideo')}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
                {explicitActionUrl ? (
                  <View style={styles.linkButton}>
                    <Ionicons color={theme.primary} name="open-outline" size={20} />
                    <Text style={styles.linkText}>{t('notificationOpenLink')}</Text>
                  </View>
                ) : null}
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleString(locale)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
