import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { LanguageContext } from '../../localization/LanguageContext';
import { adminService } from '../../services/adminService';
import { getYouTubeThumbnailUrl } from '../../utils/media';
import { useTheme } from '../../context/ThemeContext';
import { Button, Feedback, Field, useWorkshopStyles } from '../workshop/ui';
import { createStyles } from './AdminNotifications.styles';

const categories = ['general', 'workout', 'measurements', 'achievements', 'news'];
const MAX_ATTACHMENTS = 5;
const weekDays = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
};
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDateKey = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};
export const ADMIN_NOTIFICATION_DRAFT_KEY = (profileId) => `admin-notification-draft:${profileId}`;
export const ADMIN_NOTIFICATION_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const uniqueBy = (items, key) => items.filter(
  (item, index) => items.findIndex((candidate) => candidate[key] === item[key]) === index,
);

export function AdminNotifications({ userToken, initialUserId, profileId, onDraftStateChange }) {
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const workshopStyles = useWorkshopStyles();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const [view, setView] = useState('compose');
  const [historyType, setHistoryType] = useState('messages');
  const [audience, setAudience] = useState(initialUserId ? 'users' : 'all');
  const [userIds, setUserIds] = useState(initialUserId ? String(initialUserId) : '');
  const [category, setCategory] = useState('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [media, setMedia] = useState([]);
  const [history, setHistory] = useState([]);
  const [videoUrls, setVideoUrls] = useState([]);
  const [videoDraft, setVideoDraft] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState('');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const hydrated = useRef(false);
  const initialTarget = useRef(initialUserId ? String(initialUserId) : '');

  useEffect(() => {
    let active = true;
    hydrated.current = false;
    const hydrate = async () => {
      if (!profileId) { hydrated.current = true; return; }
      try {
        const raw = await AsyncStorage.getItem(ADMIN_NOTIFICATION_DRAFT_KEY(profileId));
        const draft = raw ? JSON.parse(raw) : null;
        if (active && draft && Date.now() - draft.updatedAt <= ADMIN_NOTIFICATION_DRAFT_TTL_MS) {
          setAudience(initialTarget.current ? 'users' : draft.audience || 'all');
          setUserIds(initialTarget.current || draft.userIds || '');
          setCategory(draft.category || 'general'); setTitle(draft.title || ''); setBody(draft.body || '');
          setSelectedImages(draft.selectedImages || []); setVideoUrls(draft.videoUrls || []); setVideoDraft(draft.videoDraft || '');
          setActionUrl(draft.actionUrl || ''); setScheduledAt(draft.scheduledAt || '');
        } else if (raw) await AsyncStorage.removeItem(ADMIN_NOTIFICATION_DRAFT_KEY(profileId));
      } catch (_) { /* draft restoration is best effort */ }
      if (active) hydrated.current = true;
    };
    void hydrate();
    return () => { active = false; };
  }, [profileId]);

  useEffect(() => {
    if (!hydrated.current || !profileId) return;
    const draft = { audience, userIds, category, title, body, selectedImages, videoUrls, videoDraft, actionUrl, scheduledAt, updatedAt: Date.now() };
    const meaningful = title.trim() || body.trim() || userIds.trim() || selectedImages.length || videoUrls.length || videoDraft.trim() || actionUrl.trim() || scheduledAt.trim();
    onDraftStateChange?.(Boolean(meaningful));
    void (meaningful ? AsyncStorage.setItem(ADMIN_NOTIFICATION_DRAFT_KEY(profileId), JSON.stringify(draft)) : AsyncStorage.removeItem(ADMIN_NOTIFICATION_DRAFT_KEY(profileId)));
  }, [profileId, audience, userIds, category, title, body, selectedImages, videoUrls, videoDraft, actionUrl, scheduledAt, onDraftStateChange]);

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

  useEffect(() => {
    if (!media.length) return;
    setSelectedImages((current) => current.map((item) => {
      const fresh = media.find((candidate) => candidate.id === item.id);
      return fresh ? { ...item, imageUrl: fresh.imageUrl } : item;
    }));
  }, [media]);

  const addVideo = () => {
    const value = videoDraft.trim();
    if (!value) return;
    if (!/^https:\/\/\S+$/i.test(value)) return setError(t('notificationVideoInvalid'));
    if (videoUrls.length >= MAX_ATTACHMENTS) return setError(t('notificationVideoLimit'));
    setVideoUrls((current) => [...new Set([...current, value])]);
    setVideoDraft('');
    setError('');
  };

  const pickImages = async () => {
    try {
      const remaining = MAX_ATTACHMENTS - selectedImages.length;
      if (!remaining) return setError(t('notificationImageLimit'));
      const response = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ['images'],
        quality: 0.85,
        selectionLimit: remaining,
      });
      if (!response.canceled) {
        setBusy(true);
        const uploaded = await Promise.all(response.assets.map((asset) => adminService.uploadNotificationImage(asset, userToken)));
        setSelectedImages((current) => uniqueBy([...current, ...uploaded.map((item) => ({ ...item, key: item.id }))], 'key').slice(0, MAX_ATTACHMENTS));
      }
    } catch (pickerError) {
      setError(pickerError.message);
    } finally {
      setBusy(false);
    }
  };

  const selectLibraryImage = (item) => {
    setSelectedImages((current) => uniqueBy([
      ...current,
      { id: item.id, imageUrl: item.imageUrl, key: item.id },
    ], 'key').slice(0, MAX_ATTACHMENTS));
    setError('');
    setView('compose');
  };

  const send = async () => {
    const ids = userIds.split(/[\s,;]+/).filter(Boolean).map(Number);
    const draftVideo = videoDraft.trim();
    const nextVideoUrls = draftVideo ? [...new Set([...videoUrls, draftVideo])] : videoUrls;
    if (!title.trim() && !body.trim() && !selectedImages.length && !nextVideoUrls.length && !actionUrl.trim()) return setError(t('notificationContentRequired'));
    if (draftVideo && !/^https:\/\/\S+$/i.test(draftVideo)) return setError(t('notificationVideoInvalid'));
    if (nextVideoUrls.length > MAX_ATTACHMENTS) return setError(t('notificationVideoLimit'));
    if (audience === 'users' && (!ids.length || ids.some((id) => !Number.isInteger(id) || id < 1))) return setError(t('notificationUserIdsInvalid'));
    const schedule = scheduledAt.trim().replace(' ', 'T');
    if (schedule && !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(schedule)) return setError(t('notificationScheduleInvalid'));
    setBusy(true);
    setError('');
    setResult('');
    try {
      const uploadedImages = await Promise.all(selectedImages.map((item) => (
        item.id ? item : adminService.uploadNotificationImage(item, userToken)
      )));
      const response = await adminService.sendNotification({
        audience,
        body: body.trim(),
        category,
        title: title.trim(),
        ...(uploadedImages.length ? { imageMediaIds: uploadedImages.map((item) => item.id) } : {}),
        ...(nextVideoUrls.length ? { videoUrls: nextVideoUrls } : {}),
        ...(actionUrl.trim() ? { actionUrl: actionUrl.trim() } : {}),
        ...(schedule ? { scheduledLocalAt: schedule } : {}),
        ...(audience === 'users' ? { userIds: ids } : {}),
      }, userToken);
      setResult(t('notificationQueuedFor', response));
      setAudience('all');
      setUserIds('');
      setCategory('general');
      setTitle('');
      setBody('');
      setSelectedImages([]);
      setVideoUrls([]);
      setVideoDraft('');
      setActionUrl('');
      setScheduledAt('');
      if (profileId) await AsyncStorage.removeItem(ADMIN_NOTIFICATION_DRAFT_KEY(profileId));
      onDraftStateChange?.(false);
      await loadLibrary();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const reuseNotification = (item) => {
    const imageUrls = item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];
    const mediaIds = item.mediaIds?.length ? item.mediaIds : item.mediaId ? [item.mediaId] : [];
    setTitle(item.title || '');
    setBody(item.body || '');
    setCategory(item.category || 'general');
    setVideoUrls(item.videoUrls?.length ? item.videoUrls : item.videoUrl ? [item.videoUrl] : []);
    setVideoDraft('');
    setActionUrl(item.actionUrl || '');
    setSelectedImages(imageUrls.map((imageUrl, index) => ({ id: mediaIds[index], imageUrl, key: mediaIds[index] || imageUrl })).filter((image) => image.id));
    setView('compose');
    setError('');
    setResult('');
  };

  const historySource = historyType === 'images' ? media : history;
  const filteredHistory = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const cutoff = addDays(start, -(datePreset === '7' ? 6 : 29));
    return [...historySource]
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .filter((item) => {
        const created = new Date(item.createdAt);
        if (datePreset === 'custom') return dateKey(created) === selectedDate;
        if (datePreset === 'today') return dateKey(created) === dateKey(today);
        if (datePreset === '7' || datePreset === '30') return created >= cutoff;
        return true;
      });
  }, [datePreset, historySource, selectedDate]);
  const groupedHistory = useMemo(() => filteredHistory.reduce((groups, item) => {
    const key = dateKey(new Date(item.createdAt));
    const group = groups.find((entry) => entry.key === key);
    if (group) group.items.push(item);
    else groups.push({ key, items: [item] });
    return groups;
  }, []), [filteredHistory]);
  const historyDates = useMemo(() => new Set(historySource.map((item) => dateKey(new Date(item.createdAt)))), [historySource]);
  const openCalendar = () => {
    const initial = selectedDate ? parseDateKey(selectedDate) : new Date();
    setMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
    setPendingDate(selectedDate || dateKey(new Date()));
    setCalendarOpen(true);
  };
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const calendarStart = addDays(firstDay, -((firstDay.getDay() + 6) % 7));
  const calendarDays = Array.from({ length: 42 }, (_, index) => addDays(calendarStart, index));
  const todayKey = dateKey(new Date());
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const header = (
    <View style={styles.headingRow}>
      <View style={styles.headingCopy}>
        <Text style={workshopStyles.title}>{t('adminNotifications')}</Text>
        <Text style={styles.compactHint}>{t('adminNotificationsHint')}</Text>
      </View>
      <Pressable
        accessibilityLabel={t(view === 'compose' ? 'notificationHistory' : 'notificationComposer')}
        accessibilityRole="button"
        onPress={() => setView((current) => current === 'compose' ? 'history' : 'compose')}
        style={({ pressed }) => [styles.historyButton, pressed && styles.pressed]}
      >
        <Ionicons color={theme.primary} name={view === 'compose' ? 'time-outline' : 'create-outline'} size={19} />
        <Text style={styles.historyButtonText}>{t(view === 'compose' ? 'notificationHistory' : 'notificationComposer')}</Text>
      </Pressable>
    </View>
  );

  if (view === 'history') {
    return (
      <View style={styles.container}>
        {header}
        <View accessibilityRole="tablist" style={styles.segmented}>
          {['messages', 'images'].map((value) => {
            const active = historyType === value;
            return (
              <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} key={value} onPress={() => setHistoryType(value)} style={[styles.segment, active && styles.segmentActive]}>
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{t(value === 'messages' ? 'notificationHistoryMessages' : 'notificationImageHistory')}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.historyFilters}>
          {[[ 'all', t('allDates') ], [ 'today', t('today') ], [ '7', t('last7Days') ], [ '30', t('last30Days') ]].map(([value, label]) => {
            const active = datePreset === value;
            return (
              <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} key={value} onPress={() => { setDatePreset(value); setSelectedDate(''); }} style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
          <Pressable accessibilityLabel={t('notificationSelectDate')} accessibilityRole="button" onPress={openCalendar} style={[styles.calendarButton, datePreset === 'custom' && styles.filterChipActive]}>
            <Ionicons color={datePreset === 'custom' ? theme.onPrimary : theme.textPrimary} name="calendar-outline" size={19} />
          </Pressable>
        </View>
        {datePreset === 'custom' && selectedDate ? (
          <Pressable onPress={openCalendar} style={styles.selectedDate}>
            <Text style={styles.selectedDateText}>{parseDateKey(selectedDate).toLocaleDateString(localeTag, { dateStyle: 'long' })}</Text>
            <Ionicons color={theme.textSecondary} name="chevron-down" size={16} />
          </Pressable>
        ) : null}
        <Feedback error={error} />
        {!groupedHistory.length ? (
          <View style={styles.emptyState}>
            <Ionicons color={theme.textSecondary} name={historyType === 'images' ? 'images-outline' : 'notifications-outline'} size={34} />
            <Text style={styles.emptyText}>{t(historyType === 'images' ? 'notificationImagesEmpty' : 'notificationHistoryEmpty')}</Text>
          </View>
        ) : groupedHistory.map((group) => (
          <View key={group.key} style={styles.dayGroup}>
            <Text style={styles.dayHeading}>{parseDateKey(group.key).toLocaleDateString(localeTag, { dateStyle: 'long' })}</Text>
            {historyType === 'images' ? (
              <View style={styles.imageHistoryGrid}>
                {group.items.map((item) => (
                  <Pressable accessibilityLabel={t('notificationUseImage')} accessibilityRole="button" key={item.id} onPress={() => selectLibraryImage(item)} style={({ pressed }) => [styles.imageHistoryCard, pressed && styles.pressed]}>
                    <Image source={{ uri: item.imageUrl }} style={styles.imageHistoryImage} />
                    <Text style={styles.imageMeta}>{item.width} × {item.height}</Text>
                  </Pressable>
                ))}
              </View>
            ) : group.items.map((item) => {
              const imageUrls = item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];
              const itemVideos = item.videoUrls?.length ? item.videoUrls : item.videoUrl ? [item.videoUrl] : [];
              return (
                <Pressable accessibilityRole="button" key={item.id} onPress={() => reuseNotification(item)} style={({ pressed }) => [styles.historyCard, pressed && styles.pressed]}>
                  <View style={styles.historyCardHeader}>
                    <Text style={styles.categoryLabel}>{t(`notificationCategory_${item.category}`)}</Text>
                    <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  {!!item.title && <Text style={styles.cardTitle}>{item.title}</Text>}
                  {!!item.body && <Text numberOfLines={3} style={styles.cardBody}>{item.body}</Text>}
                  {!!imageUrls.length && <ScrollView horizontal contentContainerStyle={styles.mediaStrip} showsHorizontalScrollIndicator={false}>{imageUrls.map((url) => <Image key={url} source={{ uri: url }} style={styles.historyMedia} />)}</ScrollView>}
                  {!!itemVideos.length && (
                    <ScrollView horizontal contentContainerStyle={styles.mediaStrip} showsHorizontalScrollIndicator={false}>
                      {itemVideos.map((url) => (
                        <View key={url} style={styles.videoCard}>
                          {getYouTubeThumbnailUrl(url) ? <Image source={{ uri: getYouTubeThumbnailUrl(url) }} style={styles.videoThumb} /> : null}
                          <View style={styles.videoLabel}><Ionicons color={theme.primary} name="play-circle-outline" size={17} /><Text numberOfLines={1} style={styles.videoText}>{url}</Text></View>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                  {!!item.actionUrl && <View style={styles.linkPreview}><Ionicons color={theme.primary} name="link-outline" size={16} /><Text numberOfLines={1} style={styles.linkPreviewText}>{item.actionUrl}</Text></View>}
                  <Text style={styles.counts}>{t('notificationHistoryCounts', item)}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
        <Modal animationType="fade" onRequestClose={() => setCalendarOpen(false)} transparent visible={calendarOpen}>
          <View style={styles.overlay}>
            <View style={styles.calendarModal}>
              <Text style={styles.calendarTitle}>{t('notificationSelectDate')}</Text>
              <View style={styles.monthHeader}>
                <Pressable accessibilityRole="button" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.monthArrow}><Ionicons color={theme.textPrimary} name="chevron-back" size={22} /></Pressable>
                <Text style={styles.monthTitle}>{month.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })}</Text>
                <Pressable accessibilityRole="button" disabled={month >= currentMonth} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={[styles.monthArrow, month >= currentMonth && styles.disabled]}><Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /></Pressable>
              </View>
              <View style={styles.weekHeader}>{weekDays[locale].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekLabel}>{day}</Text>)}</View>
              <View style={styles.monthGrid}>
                {calendarDays.map((date) => {
                  const key = dateKey(date);
                  const disabled = date.getMonth() !== month.getMonth() || key > todayKey;
                  const active = key === pendingDate;
                  return (
                    <Pressable accessibilityLabel={date.toLocaleDateString(localeTag)} accessibilityRole="button" disabled={disabled} key={key} onPress={() => setPendingDate(key)} style={styles.monthDay}>
                      <View style={[styles.dayCircle, active && styles.dayCircleActive]}><Text style={[styles.monthDayText, disabled && styles.disabled, active && styles.activeDayText]}>{date.getDate()}</Text></View>
                      {historyDates.has(key) && <View style={[styles.historyDot, active && styles.activeDot]} />}
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.modalActions}>
                <Pressable onPress={() => setCalendarOpen(false)} style={styles.cancelButton}><Text style={styles.cancelText}>{t('cancel')}</Text></Pressable>
                <Pressable disabled={!pendingDate} onPress={() => { setSelectedDate(pendingDate); setDatePreset('custom'); setCalendarOpen(false); }} style={[styles.applyButton, !pendingDate && styles.disabled]}><Text style={styles.applyText}>{t('apply')}</Text></Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header}
      <View style={[styles.formColumns, width >= 860 && styles.formColumnsDesktop]}>
        <View style={styles.column}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('notificationAudienceAndCategory')}</Text>
            <View style={styles.choiceRow}>
              {['all', 'users'].map((value) => {
                const active = audience === value;
                return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} key={value} onPress={() => setAudience(value)} style={[styles.choice, active && styles.choiceActive]}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{t(`notificationAudience_${value}`)}</Text></Pressable>;
              })}
            </View>
            {audience === 'users' ? <Field label={t('notificationUserIds')} onChangeText={setUserIds} placeholder="12, 27, 45" value={userIds} /> : null}
            <Text style={styles.fieldLabel}>{t('notificationCategory')}</Text>
            <View style={styles.categoryGrid}>
              {categories.map((value) => {
                const active = category === value;
                return (
                  <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} key={value} onPress={() => setCategory(value)} style={({ pressed }) => [styles.categoryChip, active && styles.categoryChipActive, pressed && styles.pressed]}>
                    <View style={[styles.categoryIndicator, active && styles.categoryIndicatorActive]} />
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{t(`notificationCategory_${value}`)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('notificationContentSection')}</Text>
            <Field label={t('notificationTitle')} maxLength={120} onChangeText={setTitle} value={title} />
            <Field label={t('notificationBody')} maxLength={1000} multiline onChangeText={setBody} value={body} />
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('notificationMediaSection')}</Text>
            <Button disabled={busy || selectedImages.length >= MAX_ATTACHMENTS} secondary onPress={pickImages}>{t('notificationChooseImages', { count: selectedImages.length, max: MAX_ATTACHMENTS })}</Button>
            {!!selectedImages.length && (
              <View style={styles.selectedMediaGrid}>
                {selectedImages.map((item) => (
                  <View key={item.key} style={styles.selectedMediaCard}>
                    <Image source={{ uri: item.uri || item.imageUrl }} style={styles.selectedMediaImage} />
                    <Pressable accessibilityLabel={t('notificationRemoveImage')} accessibilityRole="button" onPress={() => setSelectedImages((current) => current.filter((candidate) => candidate.key !== item.key))} style={styles.removeMedia}><Ionicons color={theme.onPrimary} name="close" size={17} /></Pressable>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.inlineFields}>
              <Field label={t('notificationVideoUrl')} maxLength={2048} onChangeText={setVideoDraft} onSubmitEditing={addVideo} placeholder="https://youtube.com/…" style={styles.growField} value={videoDraft} />
              <Button disabled={!videoDraft.trim() || videoUrls.length >= MAX_ATTACHMENTS} secondary onPress={addVideo} style={styles.addButton}>{t('add')}</Button>
            </View>
            {!!videoUrls.length && <View style={styles.videoList}>{videoUrls.map((url) => <View key={url} style={styles.videoPill}><Ionicons color={theme.primary} name="logo-youtube" size={17} /><Text numberOfLines={1} style={styles.videoPillText}>{url}</Text><Pressable accessibilityLabel={t('remove')} accessibilityRole="button" onPress={() => setVideoUrls((current) => current.filter((item) => item !== url))}><Ionicons color={theme.textSecondary} name="close" size={18} /></Pressable></View>)}</View>}
            <Field label={t('notificationActionUrl')} maxLength={2048} onChangeText={setActionUrl} placeholder="https://…" value={actionUrl} />
          </View>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('notificationDeliverySection')}</Text>
            <Field label={t('notificationScheduledAt')} onChangeText={setScheduledAt} placeholder="2026-10-02 18:00" value={scheduledAt} />
            <View style={styles.inlineHint}><Ionicons color={theme.textSecondary} name="time-outline" size={15} /><Text style={styles.compactHint}>{t('notificationScheduledLocalHint')}</Text></View>
          </View>
        </View>
      </View>
      <Feedback error={error} />
      {!!result && <Text accessibilityRole="alert" style={styles.success}>{result}</Text>}
      <View style={styles.sendBar}><Button disabled={busy} onPress={send} style={styles.sendButton}>{busy ? t('sending') : t('sendNotification')}</Button></View>
    </View>
  );
}
