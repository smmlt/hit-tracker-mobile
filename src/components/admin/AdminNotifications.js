import React, { useContext, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { LanguageContext } from '../../localization/LanguageContext';
import { adminService } from '../../services/adminService';
import { ImagePickerField } from '../media/ImagePickerField';
import { Button, Feedback, Field, useWorkshopStyles } from '../workshop/ui';

const categories = ['general', 'workout', 'measurements', 'achievements', 'news'];

export function AdminNotifications({ userToken, initialUserId }) {
  const { locale, t } = useContext(LanguageContext);
  const styles = useWorkshopStyles();
  const [audience, setAudience] = useState(initialUserId ? 'users' : 'all');
  const [userIds, setUserIds] = useState(initialUserId ? String(initialUserId) : '');
  const [category, setCategory] = useState('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [media, setMedia] = useState([]);
  const [history, setHistory] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  const loadLibrary = async () => {
    try {
      const [mediaResult, historyResult] = await Promise.all([
        adminService.listNotificationMedia(userToken),
        adminService.listNotificationHistory(userToken),
      ]);
      setMedia(mediaResult.items || []);
      setHistory(historyResult.items || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => { void loadLibrary(); }, [userToken]);

  const send = async () => {
    const ids = userIds.split(/[\s,;]+/).filter(Boolean).map(Number);
    if (!title.trim() && !body.trim() && !image && !selectedMedia && !videoUrl.trim() && !actionUrl.trim()) {
      return setError(t('notificationContentRequired'));
    }
    if (audience === 'users' && (!ids.length || ids.some((id) => !Number.isInteger(id) || id < 1))) {
      return setError(t('notificationUserIdsInvalid'));
    }
    const schedule = scheduledAt.trim().replace(' ', 'T');
    if (schedule && !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(schedule)) {
      return setError(t('notificationScheduleInvalid'));
    }
    setBusy(true);
    setError('');
    setResult('');
    try {
      const uploaded = image
        ? await adminService.uploadNotificationImage(image, userToken)
        : selectedMedia;
      const response = await adminService.sendNotification({
        audience,
        body: body.trim(),
        category,
        title: title.trim(),
        ...(uploaded?.id ? { imageMediaId: uploaded.id } : {}),
        ...(videoUrl.trim() ? { videoUrl: videoUrl.trim() } : {}),
        ...(actionUrl.trim() ? { actionUrl: actionUrl.trim() } : {}),
        ...(schedule ? { scheduledLocalAt: schedule } : {}),
        ...(audience === 'users' ? { userIds: ids } : {}),
      }, userToken);
      setResult(t('notificationQueuedFor', response));
      setTitle('');
      setBody('');
      setImage(null);
      setSelectedMedia(null);
      setVideoUrl('');
      setActionUrl('');
      setScheduledAt('');
      await loadLibrary();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 18 }}>
      <View>
        <Text style={styles.title}>{t('adminNotifications')}</Text>
        <Text style={styles.muted}>{t('adminNotificationsHint')}</Text>
      </View>
      <View style={styles.row}>
        {['all', 'users'].map((value) => (
          <Button key={value} secondary={audience !== value} onPress={() => setAudience(value)}>
            {t(`notificationAudience_${value}`)}
          </Button>
        ))}
      </View>
      {audience === 'users' ? (
        <Field label={t('notificationUserIds')} onChangeText={setUserIds} placeholder="12, 27, 45" value={userIds} />
      ) : null}
      <View style={styles.row}>
        {categories.map((value) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: category === value }}
            key={value}
            onPress={() => setCategory(value)}
            style={{ opacity: category === value ? 1 : 0.55 }}
          >
            <Text style={styles.text}>{t(`notificationCategory_${value}`)}</Text>
          </Pressable>
        ))}
      </View>
      <Field label={t('notificationTitle')} maxLength={120} onChangeText={setTitle} value={title} />
      <Field label={t('notificationBody')} maxLength={1000} multiline onChangeText={setBody} value={body} />
      <ImagePickerField
        aspect={[16, 9]}
        disabled={busy}
        imageUri={image?.uri || selectedMedia?.imageUrl}
        label={t('notificationChooseImage')}
        onChange={(asset) => { setImage(asset); setSelectedMedia(null); }}
        onError={(pickerError) => setError(pickerError.message)}
        previewStyle={{ aspectRatio: 16 / 9, borderRadius: 12, width: '100%' }}
      />
      {(image || selectedMedia) ? (
        <Button secondary onPress={() => { setImage(null); setSelectedMedia(null); }}>
          {t('notificationRemoveImage')}
        </Button>
      ) : null}
      {!!media.length && (
        <View style={{ gap: 8 }}>
          <Text style={styles.muted}>{t('notificationMediaLibrary')}</Text>
          <ScrollView horizontal contentContainerStyle={{ gap: 10 }} showsHorizontalScrollIndicator={false}>
            {media.map((item) => (
              <Pressable
                accessibilityLabel={t('notificationUseImage')}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedMedia?.id === item.id }}
                key={item.id}
                onPress={() => { setSelectedMedia(item); setImage(null); }}
                style={{ borderColor: selectedMedia?.id === item.id ? '#E32222' : 'transparent', borderRadius: 10, borderWidth: 3 }}
              >
                <Image source={{ uri: item.imageUrl }} style={{ borderRadius: 7, height: 84, width: 140 }} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      <Field label={t('notificationVideoUrl')} maxLength={2048} onChangeText={setVideoUrl} placeholder="https://youtube.com/…" value={videoUrl} />
      <Field label={t('notificationActionUrl')} maxLength={2048} onChangeText={setActionUrl} placeholder="https://…" value={actionUrl} />
      <Field label={t('notificationScheduledAt')} onChangeText={setScheduledAt} placeholder="2026-10-02 18:00" value={scheduledAt} />
      <Text style={styles.muted}>{t('notificationScheduledLocalHint')}</Text>
      <Feedback error={error} />
      {!!result && <Text accessibilityRole="alert" style={styles.muted}>{result}</Text>}
      <Button disabled={busy} onPress={send}>{busy ? t('sending') : t('sendNotification')}</Button>
      {!!history.length && (
        <View style={{ gap: 10 }}>
          <Text style={styles.heading}>{t('notificationHistory')}</Text>
          {history.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.id}
              onPress={() => {
                setTitle(item.title);
                setBody(item.body);
                setCategory(item.category);
                setVideoUrl(item.videoUrl || '');
                setActionUrl(item.actionUrl || '');
                setImage(null);
                setSelectedMedia(item.mediaId ? { id: item.mediaId, imageUrl: item.imageUrl } : null);
              }}
              style={{ borderColor: '#3338', borderRadius: 12, borderWidth: 1, gap: 5, padding: 12 }}
            >
              {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={{ aspectRatio: 16 / 9, borderRadius: 8, width: '100%' }} /> : null}
              <Text style={styles.text}>{item.title}</Text>
              <Text numberOfLines={2} style={styles.muted}>{item.body}</Text>
              <Text style={styles.muted}>
                {t('notificationHistoryCounts', item)} · {new Date(item.createdAt).toLocaleString(locale)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
