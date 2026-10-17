// EN: Composes notification campaigns, media attachments, audience selection, test delivery, and delivery feedback for administrators.
// UK: Створює notification campaigns, media-вкладення, вибір аудиторії, тестову доставку та feedback для адміністраторів.
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
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
/** EN: Serializes a local date as a stable YYYY-MM-DD filter key. UK: Перетворює локальну дату на стабільний ключ фільтра YYYY-MM-DD. */
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
/** EN: Parses a date filter key without introducing a UTC day shift. UK: Розбирає ключ фільтра дати без зсуву дня через UTC. */
const parseDateKey = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};
/** EN: Returns a cloned date shifted by a number of calendar days. UK: Повертає копію дати, зміщену на задану кількість календарних днів. */
const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};
/** EN: Names the per-administrator storage slot for a recoverable composer draft. UK: Формує назву сховища для чернетки редактора окремого адміністратора. */
export const ADMIN_NOTIFICATION_DRAFT_KEY = (profileId) => `admin-notification-draft:${profileId}`;
export const ADMIN_NOTIFICATION_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** EN: Keeps the first item for each attachment identity key. UK: Залишає перший елемент для кожного ключа ідентичності вкладення. */
const uniqueBy = (items, key) => items.filter(/* EN: Retains an item only at the first index where its key occurs. UK: Залишає елемент лише в першій позиції, де трапляється його ключ. */ (item, index) => items.findIndex(/* EN: Finds the first attachment with the same identity value. UK: Знаходить перше вкладення з таким самим значенням ідентичності. */ (candidate) => candidate[key] === item[key]) === index);

/** EN: Coordinates campaign composition, draft recovery, media reuse, scheduling, idempotent delivery, and history filtering. UK: Координує створення кампанії, відновлення чернетки, повторне використання медіа, планування, ідемпотентну доставку та фільтрування історії. */
export function AdminNotifications({ userToken, initialUserId, profileId, onDraftStateChange }) {
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const workshopStyles = useWorkshopStyles();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const idempotencyKeyRef = useRef(Crypto.randomUUID());
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
  const [month, setMonth] = useState(/* EN: Initializes the history calendar at the first day of the current month. UK: Ініціалізує календар історії першим днем поточного місяця. */ () => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const hydrated = useRef(false);
  const initialTarget = useRef(initialUserId ? String(initialUserId) : '');

  useEffect(/* EN: Restores a fresh per-admin draft and ignores storage results after unmount. UK: Відновлює актуальну чернетку адміністратора та ігнорує результати сховища після демонтування. */ () => {
    let active = true;
    hydrated.current = false;
    /** EN: Hydrates editable fields from a non-expired stored draft. UK: Наповнює редаговані поля з незастарілої збереженої чернетки. */
    const hydrate = async () => {
      if (!profileId) {
        hydrated.current = true;
        return;
      }
      try {
        const raw = await AsyncStorage.getItem(ADMIN_NOTIFICATION_DRAFT_KEY(profileId));
        const draft = raw ? JSON.parse(raw) : null;
        if (active && draft && Date.now() - draft.updatedAt <= ADMIN_NOTIFICATION_DRAFT_TTL_MS) {
          setAudience(initialTarget.current ? 'users' : draft.audience || 'all');
          setUserIds(initialTarget.current || draft.userIds || '');
          setCategory(draft.category || 'general');
          setTitle(draft.title || '');
          setBody(draft.body || '');
          setSelectedImages(draft.selectedImages || []);
          setVideoUrls(draft.videoUrls || []);
          setVideoDraft(draft.videoDraft || '');
          setActionUrl(draft.actionUrl || '');
          setScheduledAt(draft.scheduledAt || '');
        } else if (raw) await AsyncStorage.removeItem(ADMIN_NOTIFICATION_DRAFT_KEY(profileId));
      } catch (_) {
        /* draft restoration is best effort */
      }
      if (active) hydrated.current = true;
    };
    void hydrate();
    return /* EN: Prevents late draft hydration from updating an unmounted composer. UK: Не дозволяє пізньому відновленню чернетки оновити демонтований редактор. */ () => {
      active = false;
    };
  }, [profileId]);

  useEffect(/* EN: Persists meaningful composer state and removes storage when the draft becomes empty. UK: Зберігає змістовний стан редактора та очищає сховище, коли чернетка стає порожньою. */ () => {
    if (!hydrated.current || !profileId) return;
    const draft = {
      audience,
      userIds,
      category,
      title,
      body,
      selectedImages,
      videoUrls,
      videoDraft,
      actionUrl,
      scheduledAt,
      updatedAt: Date.now(),
    };
    const meaningful = title.trim() || body.trim() || userIds.trim() || selectedImages.length || videoUrls.length || videoDraft.trim() || actionUrl.trim() || scheduledAt.trim();
    onDraftStateChange?.(Boolean(meaningful));
    void (meaningful ? AsyncStorage.setItem(ADMIN_NOTIFICATION_DRAFT_KEY(profileId), JSON.stringify(draft)) : AsyncStorage.removeItem(ADMIN_NOTIFICATION_DRAFT_KEY(profileId)));
  }, [profileId, audience, userIds, category, title, body, selectedImages, videoUrls, videoDraft, actionUrl, scheduledAt, onDraftStateChange]);

  /** EN: Loads reusable media and notification delivery history in parallel. UK: Паралельно завантажує медіа для повторного використання та історію доставлення сповіщень. */
  const loadLibrary = async () => {
    try {
      const [mediaResult, historyResult] = await Promise.all([adminService.listNotificationMedia(userToken), adminService.listNotificationHistory(userToken)]);
      setMedia(mediaResult.items || []);
      setHistory(historyResult.items || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(/* EN: Loads history and media when the authenticated admin token changes. UK: Завантажує історію та медіа після зміни токена автентифікованого адміністратора. */ () => {
    void loadLibrary();
  }, [userToken]);

  useEffect(/* EN: Refreshes signed image URLs in selected attachments from the latest media library. UK: Оновлює підписані URL вибраних зображень за найновішою медіатекою. */ () => {
    if (!media.length) return;
    setSelectedImages(/* EN: Reconciles current selections without changing their order. UK: Узгоджує поточний вибір без зміни його порядку. */ (current) =>
      current.map(/* EN: Replaces an attachment's expired URL when fresh media exists. UK: Замінює застарілий URL вкладення, якщо доступне оновлене медіа. */ (item) => {
        const fresh = media.find(/* EN: Matches the library record by persistent media identifier. UK: Зіставляє запис медіатеки за постійним ідентифікатором медіа. */ (candidate) => candidate.id === item.id);
        return fresh ? { ...item, imageUrl: fresh.imageUrl } : item;
      }),
    );
  }, [media]);

  /** EN: Validates and adds one unique HTTPS video URL within the attachment limit. UK: Перевіряє та додає один унікальний HTTPS URL відео в межах ліміту вкладень. */
  const addVideo = () => {
    const value = videoDraft.trim();
    if (!value) return;
    if (!/^https:\/\/\S+$/i.test(value)) return setError(t('notificationVideoInvalid'));
    if (videoUrls.length >= MAX_ATTACHMENTS) return setError(t('notificationVideoLimit'));
    setVideoUrls(/* EN: Appends the URL while removing duplicates. UK: Додає URL, одночасно усуваючи дублікати. */ (current) => [...new Set([...current, value])]);
    setVideoDraft('');
    setError('');
  };

  /** EN: Lets the administrator choose, upload, deduplicate, and limit notification images. UK: Дає адміністратору змогу вибрати, завантажити, усунути дублікати та обмежити зображення сповіщення. */
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
        const uploaded = await Promise.all(response.assets.map(/* EN: Uploads each chosen local asset to managed notification media. UK: Завантажує кожен вибраний локальний файл до керованих медіа сповіщень. */ (asset) => adminService.uploadNotificationImage(asset, userToken)));
        setSelectedImages(/* EN: Merges uploads into the current unique attachment selection. UK: Об’єднує завантажені файли з поточним унікальним вибором вкладень. */ (current) => uniqueBy([...current, ...uploaded.map(/* EN: Uses the persistent media identifier as the rendering key. UK: Використовує постійний ідентифікатор медіа як ключ відображення. */ (item) => ({ ...item, key: item.id }))], 'key').slice(0, MAX_ATTACHMENTS));
      }
    } catch (pickerError) {
      setError(pickerError.message);
    } finally {
      setBusy(false);
    }
  };

  /** EN: Adds one existing library image to the draft and returns to composition. UK: Додає одне наявне зображення з медіатеки до чернетки та повертає до редагування. */
  const selectLibraryImage = (item) => {
    setSelectedImages(/* EN: Adds the library image once and enforces the attachment cap. UK: Додає зображення з медіатеки один раз і дотримується ліміту вкладень. */ (current) => uniqueBy([...current, { id: item.id, imageUrl: item.imageUrl, key: item.id }], 'key').slice(0, MAX_ATTACHMENTS));
    setError('');
    setView('compose');
  };

  /** EN: Validates the campaign, uploads remaining media, sends it once by idempotency key, and resets the draft. UK: Перевіряє кампанію, завантажує решту медіа, надсилає її один раз за ключем ідемпотентності та очищає чернетку. */
  const send = async () => {
    const ids = userIds
      .split(/[\s,;]+/)
      .filter(/* EN: Removes empty tokens produced by adjacent separators. UK: Видаляє порожні частини, утворені сусідніми роздільниками. */ Boolean)
      .map(/* EN: Converts each recipient token to a numeric user identifier. UK: Перетворює кожну частину одержувача на числовий ідентифікатор користувача. */ Number);
    const draftVideo = videoDraft.trim();
    const nextVideoUrls = draftVideo ? [...new Set([...videoUrls, draftVideo])] : videoUrls;
    if (!title.trim() && !body.trim() && !selectedImages.length && !nextVideoUrls.length && !actionUrl.trim()) return setError(t('notificationContentRequired'));
    if (draftVideo && !/^https:\/\/\S+$/i.test(draftVideo)) return setError(t('notificationVideoInvalid'));
    if (nextVideoUrls.length > MAX_ATTACHMENTS) return setError(t('notificationVideoLimit'));
    if (audience === 'users' && (!ids.length || ids.some(/* EN: Detects invalid positive-integer recipient identifiers. UK: Виявляє неправильні додатні цілі ідентифікатори одержувачів. */ (id) => !Number.isInteger(id) || id < 1))) return setError(t('notificationUserIdsInvalid'));
    const schedule = scheduledAt.trim().replace(' ', 'T');
    if (schedule && !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(schedule)) return setError(t('notificationScheduleInvalid'));
    setBusy(true);
    setError('');
    setResult('');
    try {
      const uploadedImages = await Promise.all(selectedImages.map(/* EN: Reuses persisted media and uploads only remaining local images. UK: Повторно використовує збережені медіа та завантажує лише локальні зображення, що залишилися. */ (item) => (item.id ? item : adminService.uploadNotificationImage(item, userToken))));
      const response = await adminService.sendNotification(
        {
          audience,
          body: body.trim(),
          category,
          title: title.trim(),
          ...(uploadedImages.length ? { imageMediaIds: uploadedImages.map(/* EN: Sends stable media identifiers rather than expiring image URLs. UK: Надсилає стабільні ідентифікатори медіа замість тимчасових URL зображень. */ (item) => item.id) } : {}),
          ...(nextVideoUrls.length ? { videoUrls: nextVideoUrls } : {}),
          ...(actionUrl.trim() ? { actionUrl: actionUrl.trim() } : {}),
          ...(schedule ? { scheduledLocalAt: schedule } : {}),
          ...(audience === 'users' ? { userIds: ids } : {}),
        },
        userToken,
        idempotencyKeyRef.current,
      );
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
      idempotencyKeyRef.current = Crypto.randomUUID();
      if (profileId) await AsyncStorage.removeItem(ADMIN_NOTIFICATION_DRAFT_KEY(profileId));
      onDraftStateChange?.(false);
      await loadLibrary();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  /** EN: Copies a historical notification's reusable content into a fresh composer draft. UK: Копіює придатний до повторного використання вміст історичного сповіщення до нової чернетки. */
  const reuseNotification = (item) => {
    const imageUrls = item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];
    const mediaIds = item.mediaIds?.length ? item.mediaIds : item.mediaId ? [item.mediaId] : [];
    setTitle(item.title || '');
    setBody(item.body || '');
    setCategory(item.category || 'general');
    setVideoUrls(item.videoUrls?.length ? item.videoUrls : item.videoUrl ? [item.videoUrl] : []);
    setVideoDraft('');
    setActionUrl(item.actionUrl || '');
    setSelectedImages(
      imageUrls
        .map(/* EN: Pairs each historical image URL with its persistent media identifier. UK: Поєднує кожен історичний URL зображення з його постійним ідентифікатором медіа. */ (imageUrl, index) => ({
          id: mediaIds[index],
          imageUrl,
          key: mediaIds[index] || imageUrl,
        }))
        .filter(/* EN: Keeps only images that can be safely reused by media identifier. UK: Залишає лише зображення, які можна безпечно повторно використати за ідентифікатором медіа. */ (image) => image.id),
    );
    setView('compose');
    setError('');
    setResult('');
  };

  const historySource = historyType === 'images' ? media : history;
  const filteredHistory = useMemo(/* EN: Sorts history newest-first and applies the selected date preset. UK: Сортує історію від найновішої та застосовує вибраний фільтр дати. */ () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const cutoff = addDays(start, -(datePreset === '7' ? 6 : 29));
    return [...historySource]
      .sort(/* EN: Orders history entries from newest to oldest. UK: Упорядковує записи історії від найновіших до найстаріших. */ (left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .filter(/* EN: Keeps entries matching the active custom or relative date window. UK: Залишає записи, що відповідають активній власній або відносній даті. */ (item) => {
        const created = new Date(item.createdAt);
        if (datePreset === 'custom') return dateKey(created) === selectedDate;
        if (datePreset === 'today') return dateKey(created) === dateKey(today);
        if (datePreset === '7' || datePreset === '30') return created >= cutoff;
        return true;
      });
  }, [datePreset, historySource, selectedDate]);
  const groupedHistory = useMemo(
    /* EN: Groups filtered history into ordered calendar-day sections. UK: Групує відфільтровану історію у впорядковані розділи календарних днів. */ () =>
      filteredHistory.reduce(/* EN: Appends each entry to its existing day group or creates one. UK: Додає кожен запис до наявної групи дня або створює нову. */ (groups, item) => {
        const key = dateKey(new Date(item.createdAt));
        const group = groups.find(/* EN: Locates the group for this entry's local date key. UK: Знаходить групу для локального ключа дати цього запису. */ (entry) => entry.key === key);
        if (group) group.items.push(item);
        else groups.push({ key, items: [item] });
        return groups;
      }, []),
    [filteredHistory],
  );
  const historyDates = useMemo(/* EN: Builds the set of dates that need history markers in the calendar. UK: Формує набір дат, які потребують позначок історії в календарі. */ () => new Set(historySource.map(/* EN: Converts each history timestamp to its local calendar key. UK: Перетворює кожну часову позначку історії на локальний календарний ключ. */ (item) => dateKey(new Date(item.createdAt)))), [historySource]);
  /** EN: Opens the calendar on the selected date or today and stages a pending choice. UK: Відкриває календар на вибраній даті або сьогодні та готує попередній вибір. */
  const openCalendar = () => {
    const initial = selectedDate ? parseDateKey(selectedDate) : new Date();
    setMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
    setPendingDate(selectedDate || dateKey(new Date()));
    setCalendarOpen(true);
  };
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const calendarStart = addDays(firstDay, -((firstDay.getDay() + 6) % 7));
  const calendarDays = Array.from({ length: 42 }, /* EN: Produces one date for each cell of the six-week grid. UK: Створює дату для кожної клітинки шеститижневої сітки. */ (_, index) => addDays(calendarStart, index));
  const todayKey = dateKey(new Date());
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  /** EN: Builds the shared header whose callbacks switch composer/history views and expose pressed feedback. UK: Формує спільний заголовок, callback якого перемикають редактор та історію й показують стан натискання. */
  const header = (
    <View style={styles.headingRow}>
      <View style={styles.headingCopy}>
        <Text style={workshopStyles.title}>{t('adminNotifications')}</Text>
        <Text style={styles.compactHint}>{t('adminNotificationsHint')}</Text>
      </View>
      <Pressable
        accessibilityLabel={t(view === 'compose' ? 'notificationHistory' : 'notificationComposer')}
        accessibilityRole="button"
        onPress={
          // EN: Switches between campaign composition and delivery history.
          // UK: Перемикає між створенням кампанії та історією доставлення.
          () => setView(/* EN: Inverts the current compose/history view. UK: Перемикає поточне подання створення або історії. */ (current) => (current === 'compose' ? 'history' : 'compose'))
        }
        style={
          // EN: Adds pressed feedback to the view-switch control.
          // UK: Додає візуальний відгук натискання до перемикача подань.
          ({ pressed }) => [styles.historyButton, pressed && styles.pressed]
        }
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
          {['messages', 'images'].map(/* EN: Renders the message and image history tabs. UK: Відображає вкладки історії повідомлень і зображень. */ (value) => {
            const active = historyType === value;
            return (
              <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} key={value} onPress={
                // EN: Selects the requested history source.
                // UK: Вибирає потрібне джерело історії.
                () => setHistoryType(value)
              } style={[styles.segment, active && styles.segmentActive]}>
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{t(value === 'messages' ? 'notificationHistoryMessages' : 'notificationImageHistory')}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.historyFilters}>
          {[
            ['all', t('allDates')],
            ['today', t('today')],
            ['7', t('last7Days')],
            ['30', t('last30Days')],
          ].map(/* EN: Renders each relative-date history filter. UK: Відображає кожен фільтр історії за відносною датою. */ ([value, label]) => {
            const active = datePreset === value;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={value}
                onPress={
                  // EN: Activates this preset and clears any previous custom date.
                  // UK: Активує цей фільтр і очищає попередню власну дату.
                  () => {
                  setDatePreset(value);
                  setSelectedDate('');
                  }
                }
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityLabel={t('notificationSelectDate')}
            accessibilityRole="button"
            onPress={openCalendar}
            style={[styles.calendarButton, datePreset === 'custom' && styles.filterChipActive]}
          >
            <Ionicons color={datePreset === 'custom' ? theme.onPrimary : theme.textPrimary} name="calendar-outline" size={19} />
          </Pressable>
        </View>
        {datePreset === 'custom' && selectedDate ? (
          <Pressable onPress={openCalendar} style={styles.selectedDate}>
            <Text style={styles.selectedDateText}>
              {parseDateKey(selectedDate).toLocaleDateString(localeTag, {
                dateStyle: 'long',
              })}
            </Text>
            <Ionicons color={theme.textSecondary} name="chevron-down" size={16} />
          </Pressable>
        ) : null}
        <Feedback error={error} />
        {!groupedHistory.length ? (
          <View style={styles.emptyState}>
            <Ionicons color={theme.textSecondary} name={historyType === 'images' ? 'images-outline' : 'notifications-outline'} size={34} />
            <Text style={styles.emptyText}>{t(historyType === 'images' ? 'notificationImagesEmpty' : 'notificationHistoryEmpty')}</Text>
          </View>
        ) : (
          groupedHistory.map(/* EN: Renders one dated section of filtered history. UK: Відображає один датований розділ відфільтрованої історії. */ (group) => (
            <View key={group.key} style={styles.dayGroup}>
              <Text style={styles.dayHeading}>
                {parseDateKey(group.key).toLocaleDateString(localeTag, {
                  dateStyle: 'long',
                })}
              </Text>
              {historyType === 'images' ? (
                <View style={styles.imageHistoryGrid}>
                  {group.items.map(/* EN: Renders one reusable image-library entry. UK: Відображає один запис медіатеки для повторного використання. */ (item) => (
                    <Pressable
                      accessibilityLabel={t('notificationUseImage')}
                      accessibilityRole="button"
                      key={item.id}
                      onPress={
                        // EN: Reuses this historical image in the composer.
                        // UK: Повторно використовує це історичне зображення в редакторі.
                        () => selectLibraryImage(item)
                      }
                      style={
                        // EN: Adds pressed feedback to an image-history card.
                        // UK: Додає візуальний відгук натискання до картки історії зображень.
                        ({ pressed }) => [styles.imageHistoryCard, pressed && styles.pressed]
                      }
                    >
                      <Image source={{ uri: item.imageUrl }} style={styles.imageHistoryImage} />
                      <Text style={styles.imageMeta}>
                        {item.width} × {item.height}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                group.items.map(/* EN: Renders one sent or scheduled notification history card. UK: Відображає одну картку історії надісланого або запланованого сповіщення. */ (item) => {
                  const imageUrls = item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];
                  const itemVideos = item.videoUrls?.length ? item.videoUrls : item.videoUrl ? [item.videoUrl] : [];
                  return (
                    <Pressable accessibilityRole="button" key={item.id} onPress={
                      // EN: Copies this historical notification into the composer.
                      // UK: Копіює це історичне сповіщення до редактора.
                      () => reuseNotification(item)
                    } style={
                      // EN: Adds pressed feedback to a notification-history card.
                      // UK: Додає візуальний відгук натискання до картки історії сповіщень.
                      ({ pressed }) => [styles.historyCard, pressed && styles.pressed]
                    }>
                      <View style={styles.historyCardHeader}>
                        <Text style={styles.categoryLabel}>{t(`notificationCategory_${item.category}`)}</Text>
                        <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                      {!!item.title && <Text style={styles.cardTitle}>{item.title}</Text>}
                      {!!item.body && (
                        <Text numberOfLines={3} style={styles.cardBody}>
                          {item.body}
                        </Text>
                      )}
                      {!!imageUrls.length && (
                        <ScrollView horizontal contentContainerStyle={styles.mediaStrip} showsHorizontalScrollIndicator={false}>
                          {imageUrls.map(/* EN: Renders each historical image preview. UK: Відображає кожен попередній перегляд історичного зображення. */ (url) => (
                            <Image key={url} source={{ uri: url }} style={styles.historyMedia} />
                          ))}
                        </ScrollView>
                      )}
                      {!!itemVideos.length && (
                        <ScrollView horizontal contentContainerStyle={styles.mediaStrip} showsHorizontalScrollIndicator={false}>
                          {itemVideos.map(/* EN: Renders each historical video link and available thumbnail. UK: Відображає кожне історичне посилання на відео та доступну мініатюру. */ (url) => (
                            <View key={url} style={styles.videoCard}>
                              {getYouTubeThumbnailUrl(url) ? <Image source={{ uri: getYouTubeThumbnailUrl(url) }} style={styles.videoThumb} /> : null}
                              <View style={styles.videoLabel}>
                                <Ionicons color={theme.primary} name="play-circle-outline" size={17} />
                                <Text numberOfLines={1} style={styles.videoText}>
                                  {url}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </ScrollView>
                      )}
                      {!!item.actionUrl && (
                        <View style={styles.linkPreview}>
                          <Ionicons color={theme.primary} name="link-outline" size={16} />
                          <Text numberOfLines={1} style={styles.linkPreviewText}>
                            {item.actionUrl}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.counts}>{t('notificationHistoryCounts', item)}</Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          ))
        )}
        <Modal animationType="fade" onRequestClose={
          // EN: Closes the calendar for the platform back action.
          // UK: Закриває календар у відповідь на системну дію повернення.
          () => setCalendarOpen(false)
        } transparent visible={calendarOpen}>
          <View style={styles.overlay}>
            <View style={styles.calendarModal}>
              <Text style={styles.calendarTitle}>{t('notificationSelectDate')}</Text>
              <View style={styles.monthHeader}>
                <Pressable accessibilityRole="button" onPress={
                  // EN: Moves the history calendar to the previous month.
                  // UK: Переміщує календар історії до попереднього місяця.
                  () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
                } style={styles.monthArrow}>
                  <Ionicons color={theme.textPrimary} name="chevron-back" size={22} />
                </Pressable>
                <Text style={styles.monthTitle}>
                  {month.toLocaleDateString(localeTag, {
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={month >= currentMonth}
                  onPress={
                    // EN: Moves the history calendar to the next month.
                    // UK: Переміщує календар історії до наступного місяця.
                    () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
                  }
                  style={[styles.monthArrow, month >= currentMonth && styles.disabled]}
                >
                  <Ionicons color={theme.textPrimary} name="chevron-forward" size={22} />
                </Pressable>
              </View>
              <View style={styles.weekHeader}>
                {weekDays[locale].map(/* EN: Renders localized weekday headings with stable duplicate-safe keys. UK: Відображає локалізовані заголовки днів тижня зі стабільними ключами без конфліктів. */ (day, index) => (
                  <Text key={`${day}-${index}`} style={styles.weekLabel}>
                    {day}
                  </Text>
                ))}
              </View>
              <View style={styles.monthGrid}>
                {calendarDays.map(/* EN: Renders one selectable past-or-present day in the calendar grid. UK: Відображає один доступний минулий або поточний день у календарній сітці. */ (date) => {
                  const key = dateKey(date);
                  const disabled = date.getMonth() !== month.getMonth() || key > todayKey;
                  const active = key === pendingDate;
                  return (
                    <Pressable
                      accessibilityLabel={date.toLocaleDateString(localeTag)}
                      accessibilityRole="button"
                      disabled={disabled}
                      key={key}
                      onPress={
                        // EN: Stages this date without applying the history filter yet.
                        // UK: Попередньо вибирає цю дату без негайного застосування фільтра історії.
                        () => setPendingDate(key)
                      }
                      style={styles.monthDay}
                    >
                      <View style={[styles.dayCircle, active && styles.dayCircleActive]}>
                        <Text style={[styles.monthDayText, disabled && styles.disabled, active && styles.activeDayText]}>{date.getDate()}</Text>
                      </View>
                      {historyDates.has(key) && <View style={[styles.historyDot, active && styles.activeDot]} />}
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.modalActions}>
                <Pressable onPress={
                  // EN: Discards the staged calendar choice and closes the modal.
                  // UK: Відкидає попередній вибір календаря та закриває модальне вікно.
                  () => setCalendarOpen(false)
                } style={styles.cancelButton}>
                  <Text style={styles.cancelText}>{t('cancel')}</Text>
                </Pressable>
                <Pressable
                  disabled={!pendingDate}
                  onPress={
                    // EN: Applies the staged date as a custom history filter.
                    // UK: Застосовує попередньо вибрану дату як власний фільтр історії.
                    () => {
                    setSelectedDate(pendingDate);
                    setDatePreset('custom');
                    setCalendarOpen(false);
                    }
                  }
                  style={[styles.applyButton, !pendingDate && styles.disabled]}
                >
                  <Text style={styles.applyText}>{t('apply')}</Text>
                </Pressable>
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
              {['all', 'users'].map(/* EN: Renders broadcast and explicit-user audience choices. UK: Відображає варіанти аудиторії для всіх або визначених користувачів. */ (value) => {
                const active = audience === value;
                return (
                  <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} key={value} onPress={
                    // EN: Selects this notification audience mode.
                    // UK: Вибирає цей режим аудиторії сповіщення.
                    () => setAudience(value)
                  } style={[styles.choice, active && styles.choiceActive]}>
                    <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{t(`notificationAudience_${value}`)}</Text>
                  </Pressable>
                );
              })}
            </View>
            {audience === 'users' ? <Field label={t('notificationUserIds')} onChangeText={setUserIds} placeholder="12, 27, 45" value={userIds} /> : null}
            <Text style={styles.fieldLabel}>{t('notificationCategory')}</Text>
            <View style={styles.categoryGrid}>
              {categories.map(/* EN: Renders each notification category choice. UK: Відображає кожен варіант категорії сповіщення. */ (value) => {
                const active = category === value;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={value}
                    onPress={
                      // EN: Selects the category used for preference filtering and presentation.
                      // UK: Вибирає категорію для фільтрування налаштувань і відображення.
                      () => setCategory(value)
                    }
                    style={
                      // EN: Combines selected and pressed visual states for the category chip.
                      // UK: Поєднує візуальні стани вибору й натискання для кнопки категорії.
                      ({ pressed }) => [styles.categoryChip, active && styles.categoryChipActive, pressed && styles.pressed]
                    }
                  >
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
            <Button disabled={busy || selectedImages.length >= MAX_ATTACHMENTS} secondary onPress={pickImages}>
              {t('notificationChooseImages', {
                count: selectedImages.length,
                max: MAX_ATTACHMENTS,
              })}
            </Button>
            {!!selectedImages.length && (
              <View style={styles.selectedMediaGrid}>
                {selectedImages.map(/* EN: Renders each selected image with a removal action. UK: Відображає кожне вибране зображення з дією видалення. */ (item) => (
                  <View key={item.key} style={styles.selectedMediaCard}>
                    <Image source={{ uri: item.uri || item.imageUrl }} style={styles.selectedMediaImage} />
                    <Pressable
                      accessibilityLabel={t('notificationRemoveImage')}
                      accessibilityRole="button"
                      onPress={
                        // EN: Removes this image from the draft attachment list.
                        // UK: Видаляє це зображення зі списку вкладень чернетки.
                        () => setSelectedImages(/* EN: Rebuilds the selection without the captured image key. UK: Перебудовує вибір без збереженого ключа зображення. */ (current) => current.filter(/* EN: Keeps every attachment except the removed image. UK: Залишає всі вкладення, крім видаленого зображення. */ (candidate) => candidate.key !== item.key))
                      }
                      style={styles.removeMedia}
                    >
                      <Ionicons color={theme.onPrimary} name="close" size={17} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.inlineFields}>
              <Field
                label={t('notificationVideoUrl')}
                maxLength={2048}
                onChangeText={setVideoDraft}
                onSubmitEditing={addVideo}
                placeholder="https://youtube.com/…"
                style={styles.growField}
                value={videoDraft}
              />
              <Button disabled={!videoDraft.trim() || videoUrls.length >= MAX_ATTACHMENTS} secondary onPress={addVideo} style={styles.addButton}>
                {t('add')}
              </Button>
            </View>
            {!!videoUrls.length && (
              <View style={styles.videoList}>
                {videoUrls.map(/* EN: Renders each attached video URL with a removal action. UK: Відображає кожен доданий URL відео з дією видалення. */ (url) => (
                  <View key={url} style={styles.videoPill}>
                    <Ionicons color={theme.primary} name="logo-youtube" size={17} />
                    <Text numberOfLines={1} style={styles.videoPillText}>
                      {url}
                    </Text>
                    <Pressable accessibilityLabel={t('remove')} accessibilityRole="button" onPress={
                      // EN: Removes this video URL from the draft.
                      // UK: Видаляє цей URL відео з чернетки.
                      () => setVideoUrls(/* EN: Rebuilds video attachments without the captured URL. UK: Перебудовує вкладення відео без збереженого URL. */ (current) => current.filter(/* EN: Keeps every video URL except the removed one. UK: Залишає всі URL відео, крім видаленого. */ (item) => item !== url))
                    }>
                      <Ionicons color={theme.textSecondary} name="close" size={18} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            <Field label={t('notificationActionUrl')} maxLength={2048} onChangeText={setActionUrl} placeholder="https://…" value={actionUrl} />
          </View>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('notificationDeliverySection')}</Text>
            <Field label={t('notificationScheduledAt')} onChangeText={setScheduledAt} placeholder="2026-10-02 18:00" value={scheduledAt} />
            <View style={styles.inlineHint}>
              <Ionicons color={theme.textSecondary} name="time-outline" size={15} />
              <Text style={styles.compactHint}>{t('notificationScheduledLocalHint')}</Text>
            </View>
          </View>
        </View>
      </View>
      <Feedback error={error} />
      {!!result && (
        <Text accessibilityRole="alert" style={styles.success}>
          {result}
        </Text>
      )}
      <View style={styles.sendBar}>
        <Button disabled={busy} onPress={send} style={styles.sendButton}>
          {busy ? t('sending') : t('sendNotification')}
        </Button>
      </View>
    </View>
  );
}
