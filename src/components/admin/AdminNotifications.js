import React, { useContext, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LanguageContext } from '../../localization/LanguageContext';
import { adminService } from '../../services/adminService';
import { Button, Feedback, Field, useWorkshopStyles } from '../workshop/ui';

const categories = ['general', 'workout', 'measurements', 'achievements', 'news'];

export function AdminNotifications({ userToken, initialUserId }) {
  const { t } = useContext(LanguageContext);
  const styles = useWorkshopStyles();
  const [audience, setAudience] = useState(initialUserId ? 'users' : 'all');
  const [userIds, setUserIds] = useState(initialUserId ? String(initialUserId) : '');
  const [category, setCategory] = useState('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  const send = async () => {
    const ids = userIds.split(/[\s,;]+/).filter(Boolean).map(Number);
    if (!title.trim() || !body.trim()) return setError(t('notificationTitleBodyRequired'));
    if (audience === 'users' && (!ids.length || ids.some((id) => !Number.isInteger(id) || id < 1))) {
      return setError(t('notificationUserIdsInvalid'));
    }
    const schedule = scheduledAt.trim();
    const scheduleDate = schedule ? new Date(schedule.replace(' ', 'T')) : null;
    if (scheduleDate && Number.isNaN(scheduleDate.getTime())) return setError(t('notificationScheduleInvalid'));
    setBusy(true);
    setError('');
    setResult('');
    try {
      const response = await adminService.sendNotification({
        audience,
        body: body.trim(),
        category,
        title: title.trim(),
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
        ...(actionUrl.trim() ? { actionUrl: actionUrl.trim() } : {}),
        ...(scheduleDate ? { scheduledAt: scheduleDate.toISOString() } : {}),
        ...(audience === 'users' ? { userIds: ids } : {}),
      }, userToken);
      setResult(t('notificationQueuedFor', response));
      setTitle('');
      setBody('');
      setImageUrl('');
      setActionUrl('');
      setScheduledAt('');
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
        <Field
          label={t('notificationUserIds')}
          onChangeText={setUserIds}
          placeholder="12, 27, 45"
          value={userIds}
        />
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
      <Field label={t('notificationImageUrl')} maxLength={2048} onChangeText={setImageUrl} placeholder="https://…" value={imageUrl} />
      <Field label={t('notificationActionUrl')} maxLength={2048} onChangeText={setActionUrl} placeholder="https://…" value={actionUrl} />
      <Field label={t('notificationScheduledAt')} onChangeText={setScheduledAt} placeholder="2026-10-02 18:00" value={scheduledAt} />
      <Feedback error={error} />
      {!!result && <Text accessibilityRole="alert" style={styles.muted}>{result}</Text>}
      <Button disabled={busy} onPress={send}>{busy ? t('sending') : t('sendNotification')}</Button>
    </View>
  );
}
