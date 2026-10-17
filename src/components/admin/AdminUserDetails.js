// EN: Shows an administrative user profile and emits guarded role, session, suspension, and deletion actions.
// UK: Показує адміністративний профіль користувача та передає захищені дії ролі, сесій, блокування й видалення.
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, Text, View } from 'react-native';

import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../localization/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';
import { Button, Feedback } from '../workshop/ui';
import { Field, Sheet } from '../workshop/ui';
import { ConfirmDialog } from '../feedback';
import { palette } from '../../constants/colors';
import { createStyles } from './AdminUserDetails.styles';
import { defaultSuspensionInput, suspensionInputToIso } from '../../utils/accountSuspension';

const filters = ['all', 'account', 'profile', 'training', 'programs', 'access'];

/**
 * EN: Converts an optional profile value to display text while preserving meaningful zero and false values.
 * UK: Перетворює необов'язкове значення профілю на текст, зберігаючи змістовні нульові та хибні значення.
 */
const displayValue = (value, fallback) =>
  value === null || value === undefined || value === '' ? fallback : String(value);

/**
 * EN: Rounds a duration to minutes and returns a compact localized hours-and-minutes label.
 * UK: Округлює тривалість до хвилин і повертає стислий локалізований підпис у годинах та хвилинах.
 */
function durationLabel(seconds, t) {
  const totalMinutes = Math.max(0, Math.round(Number(seconds || 0) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [hours ? `${hours} ${t('hourShort')}` : '', minutes || !hours ? `${minutes} ${t('minuteShort')}` : '']
    .filter(Boolean)
    .join(' ');
}

/**
 * EN: Describes one audited profile-field transition with localized field and fallback labels.
 * UK: Описує одну зафіксовану зміну поля профілю з локалізованими назвами поля та запасного значення.
 */
function changeLabel(change, t) {
  const label = t(`adminField_${change.field}`);
  return `${label}: ${displayValue(change.from, t('notSpecified'))} → ${displayValue(change.to, t('notSpecified'))}`;
}

/**
 * EN: Maps each audit event type to the localized title and metadata shown in the administrator timeline.
 * UK: Зіставляє кожен тип події аудиту з локалізованими заголовком і даними для часової шкали адміністратора.
 */
function activityCopy(event, t) {
  const data = event.metadata || {};
  switch (event.type) {
    case 'account.created':
      return [t('activityAccountCreated'), ''];
    case 'account.google_linked':
      return [t('activityGoogleLinked'), ''];
    case 'account.password_changed':
      return [t('activityPasswordChanged'), ''];
    case 'username.changed':
      return [
        t('activityUsernameChanged'),
        `${data.from ? `@${data.from}` : t('notSpecified')} → @${data.to}`,
      ];
    case 'profile.updated':
      return [
        t('activityProfileUpdated'),
        Array.isArray(data.changes) ? data.changes.map(/* EN: Formats every changed profile field for the event summary. / UK: Форматує кожне змінене поле профілю для підсумку події. */ (change) => changeLabel(change, t)).join(' · ') : '',
      ];
    case 'avatar.updated':
      return [t('activityAvatarUpdated'), ''];
    case 'avatar.removed':
      return [t('activityAvatarRemoved'), ''];
    case 'role.changed':
      return [
        t('activityRoleChanged'),
        `${t(`role_${data.from}`)} → ${t(`role_${data.to}`)}`,
      ];
    case 'account.sessions_revoked':
      return [t('activitySessionsRevoked'), t('sessionsRevokedCount', { count: data.sessionCount || 0 })];
    case 'account.suspended':
      return [t('activityAccountSuspended'), `${data.expiresAt ? new Date(data.expiresAt).toLocaleString() : ''} · ${data.reason || ''}`];
    case 'account.unsuspended':
      return [t('activityAccountRestored'), ''];
    case 'workout.completed':
      return [
        t('activityWorkoutCompleted', { name: data.programName || data.title || t('workout') }),
        `${durationLabel(data.durationSeconds, t)} · ${t('setsCount', { count: data.setCount || 0 })}`,
      ];
    case 'program.created':
      return [t('activityProgramCreated', { name: data.name }), ''];
    case 'program.imported':
      return [t('activityProgramImported', { name: data.name }), ''];
    case 'schedule.created':
      return [
        t('activityScheduleCreated', { name: data.programName }),
        data.scheduledFor ? t('scheduledForDate', { date: data.scheduledFor }) : '',
      ];
    case 'body_metric.recorded':
      return [
        t('activityWeightRecorded'),
        data.weight === null || data.weight === undefined ? '' : `${data.weight} ${t('kgShort')}`,
      ];
    default:
      return [t('activityUpdated'), ''];
  }
}

/**
 * EN: Renders one selectable label-value pair in the administrative profile grid.
 * UK: Відображає одну придатну для копіювання пару назви та значення в адміністративній сітці профілю.
 */
function InfoItem({ label, value, styles }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text selectable style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/**
 * EN: Loads one user's administrative profile, paginated audit history, and permission-gated security actions.
 * UK: Завантажує адміністративний профіль одного користувача, сторінкову історію аудиту та захищені правами дії безпеки.
 */
export function AdminUserDetails({ userId, revision, onBack, onManage, onNotify, manageDisabled, canSecurityActions, onSecurityChanged }) {
  const { userToken } = useContext(AuthContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const [details, setDetails] = useState(null);
  const [activity, setActivity] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [securityDialog, setSecurityDialog] = useState(null);
  const [banOpen, setBanOpen] = useState(false);
  const [banUntil, setBanUntil] = useState(/* EN: Creates a fresh default suspension deadline only for this component instance. / UK: Створює новий типовий строк блокування лише для цього екземпляра компонента. */ () => defaultSuspensionInput());
  const [banReason, setBanReason] = useState('');
  const [securityBusy, setSecurityBusy] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');

  /**
   * EN: Fetches profile details and the first activity page together, replacing all visible user data for the selected revision.
   * UK: Одночасно завантажує дані профілю та першу сторінку активності, замінюючи всі видимі дані користувача для вибраної редакції.
   */
  const load = useCallback(/* EN: Replaces the profile and activity snapshot from two parallel requests. / UK: Замінює знімок профілю й активності результатами двох паралельних запитів. */ async () => {
    setLoading(true);
    setError('');
    try {
      const [nextDetails, nextActivity] = await Promise.all([
        adminService.getUserDetails(userId, userToken),
        adminService.getUserActivity(userId, 1, userToken),
      ]);
      setDetails(nextDetails);
      setActivity(nextActivity.items);
      setPage(1);
      setHasMore(nextActivity.hasMore);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [userId, userToken]);

  useEffect(/* EN: Reloads details when the selected user, credentials, or parent-issued revision changes. / UK: Повторно завантажує дані після зміни вибраного користувача, облікових даних або редакції від батьківського компонента. */ () => {
    load();
  }, [load, revision]);

  /**
   * EN: Appends exactly the next audit page and advances pagination only after a successful response.
   * UK: Додає саме наступну сторінку аудиту й переходить далі лише після успішної відповіді.
   */
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await adminService.getUserActivity(userId, nextPage, userToken);
      setActivity(/* EN: Appends server results to the latest state so concurrent rendering cannot discard existing events. / UK: Додає серверні результати до найновішого стану, щоб паралельне відображення не втратило наявні події. */ (current) => [...current, ...result.items]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const visibleActivity = useMemo(
    /* EN: Recomputes the visible audit list only when its source or selected category changes. / UK: Повторно обчислює видиму історію аудиту лише після зміни джерела або вибраної категорії. */
    () => activity.filter(/* EN: Keeps every event for “all”, otherwise only the selected audit category. / UK: Для варіанта «усі» залишає кожну подію, інакше — лише вибрану категорію аудиту. */ (event) => filter === 'all' || event.category === filter),
    [activity, filter],
  );

  /**
   * EN: Closes security dialogs, reloads authoritative user data, notifies the parent, and exposes a localized success result.
   * UK: Закриває діалоги безпеки, повторно завантажує достовірні дані користувача, сповіщає батьківський компонент і показує локалізований успішний результат.
   */
  const finishSecurityAction = async (messageKey) => {
    setSecurityDialog(null);
    setBanOpen(false);
    setBanReason('');
    await load();
    await onSecurityChanged?.();
    setSecurityMessage(t(messageKey));
  };

  /**
   * EN: Revokes every session belonging to the selected user and refreshes their security activity afterward.
   * UK: Відкликає всі сесії вибраного користувача та після цього оновлює його безпекову активність.
   */
  const revokeSessions = async () => {
    setSecurityBusy(true);
    setSecurityError('');
    setSecurityMessage('');
    try {
      await adminService.revokeUserSessions(userId, userToken);
      await finishSecurityAction('userSessionsRevoked');
    } catch (actionError) {
      setSecurityError(actionError.message);
    } finally {
      setSecurityBusy(false);
    }
  };

  /**
   * EN: Validates the local deadline and reason before submitting a normalized suspension to the server.
   * UK: Перевіряє локальний строк і причину перед надсиланням нормалізованого блокування на сервер.
   */
  const suspendUser = async () => {
    const suspendedUntil = suspensionInputToIso(banUntil);
    if (!suspendedUntil) return setSecurityError(t('suspensionDateInvalid'));
    if (banReason.trim().length < 3) return setSecurityError(t('suspensionReasonRequired'));
    setSecurityBusy(true);
    setSecurityError('');
    setSecurityMessage('');
    try {
      await adminService.suspendUser(userId, { suspendedUntil, reason: banReason.trim() }, userToken);
      await finishSecurityAction('userSuspended');
    } catch (actionError) {
      setSecurityError(actionError.message);
    } finally {
      setSecurityBusy(false);
    }
  };

  /**
   * EN: Restores access for the selected user and then reloads the authoritative security state.
   * UK: Відновлює доступ вибраного користувача, а потім повторно завантажує достовірний стан безпеки.
   */
  const unsuspendUser = async () => {
    setSecurityBusy(true);
    setSecurityError('');
    setSecurityMessage('');
    try {
      await adminService.unsuspendUser(userId, userToken);
      await finishSecurityAction('userRestored');
    } catch (actionError) {
      setSecurityError(actionError.message);
    } finally {
      setSecurityBusy(false);
    }
  };

  if (loading && !details) {
    return <ActivityIndicator color={theme.primary} size="large" />;
  }
  if (!details) {
    return <Feedback error={error || t('adminUserLoadFailed')} onRetry={load} />;
  }

  const { user, latestMetric, stats } = details;
  const initials = (user.displayName || user.username || '?').slice(0, 2).toUpperCase();
  const authMethods = [
    user.authMethods.password && t('authMethodPassword'),
    user.authMethods.google && 'Google',
  ].filter(Boolean).join(' + ');
  /**
   * EN: Formats server timestamps in the administrator's locale and supplies a localized empty-state label.
   * UK: Форматує серверні часові позначки відповідно до мови адміністратора й повертає локалізований підпис для відсутнього значення.
   */
  const dateTime = (value) => value
    ? new Date(value).toLocaleString(localeTag, { dateStyle: 'medium', timeStyle: 'short' })
    : t('notSpecified');

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <View style={styles.topBarSlot}><Button secondary onPress={onBack}>{t('backToUsers')}</Button></View>
        <View style={[styles.topBarSlot, styles.topBarCenter]}><Button secondary onPress={/* EN: Passes the currently loaded user to the notification workflow. / UK: Передає поточного завантаженого користувача до процесу надсилання сповіщення. */ () => onNotify(user)}>{t('sendUserNotification')}</Button></View>
        <View style={[styles.topBarSlot, styles.topBarRight]}><Button secondary disabled={manageDisabled} onPress={/* EN: Passes the authoritative user snapshot to the management workflow. / UK: Передає достовірний знімок користувача до процесу керування. */ () => onManage(user)}>{t('manage')}</Button></View>
      </View>

      <View style={styles.hero}>
        <View style={styles.identity}>
          {user.avatarUrl ? (
            <Pressable
              accessibilityLabel={t('viewAvatar')}
              accessibilityRole="button"
              onPress={/* EN: Opens the full-size avatar preview. / UK: Відкриває повнорозмірний попередній перегляд аватара. */ () => setAvatarOpen(true)}
              style={/* EN: Adds pressed feedback without changing the base avatar layout. / UK: Додає відгук на натискання без зміни основного розташування аватара. */ ({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
            >
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            </Pressable>
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.identityText}>
            <Text style={styles.name}>{user.displayName}</Text>
            <Text selectable style={styles.infoLabel}>
              {user.username ? `@${user.username} · ` : ''}{user.email}
            </Text>
            <View style={styles.roleRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.infoLabel}>{t(`role_${user.role}`)}</Text>
              </View>
              <View style={styles.status}>
                <View style={[styles.dot, { backgroundColor: user.online ? palette.greenOnline : palette.gray }]} />
                <Text style={styles.infoLabel}>{user.online ? t('online') : t('offline')}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('userProfileDetails')}</Text>
        <View style={styles.infoGrid}>
          <InfoItem styles={styles} label={t('userId')} value={`#${user.id}`} />
          <InfoItem styles={styles} label={t('email')} value={user.email} />
          <InfoItem styles={styles} label={t('authMethod')} value={authMethods || t('notSpecified')} />
          <InfoItem styles={styles} label={t('registeredAt')} value={dateTime(user.createdAt)} />
          <InfoItem styles={styles} label={t('lastSeenAt')} value={dateTime(user.lastSeenAt)} />
          <InfoItem styles={styles} label={t('age')} value={displayValue(user.age, t('notSpecified'))} />
          <InfoItem styles={styles} label={t('gender')} value={user.gender ? t(user.gender) : t('notSpecified')} />
          <InfoItem styles={styles} label={t('height')} value={user.height ? `${user.height} ${t('cmShort')}` : t('notSpecified')} />
          <InfoItem styles={styles} label={t('currentGoal')} value={displayValue(user.goal, t('notSpecified'))} />
          <InfoItem styles={styles} label={t('weight')} value={latestMetric?.weight ? `${latestMetric.weight} ${t('kgShort')}` : t('notSpecified')} />
        </View>
      </View>

      {canSecurityActions && (
        <View style={styles.securitySection}>
          <Text style={styles.sectionTitle}>{t('adminAccountSecurity')}</Text>
          <Text style={styles.securityHint}>{t('adminAccountSecurityHint')}</Text>
          {user.suspension ? (
            <View style={styles.suspensionCard}>
              <Text style={styles.suspensionTitle}>{t('accountCurrentlySuspended')}</Text>
              <Text style={styles.infoValue}>{dateTime(user.suspension.expiresAt)}</Text>
              <Text style={styles.securityHint}>{user.suspension.reason}</Text>
            </View>
          ) : null}
          <Feedback error={securityError} />
          {!!securityMessage && <Text accessibilityRole="alert" style={styles.securityHint}>{securityMessage}</Text>}
          <View style={styles.securityActions}>
            <Button secondary disabled={securityBusy} onPress={/* EN: Opens confirmation before the destructive all-session revocation. / UK: Відкриває підтвердження перед незворотним відкликанням усіх сесій. */ () => setSecurityDialog('sessions')}>
              {t('revokeUserSessions')}
            </Button>
            {user.suspension ? (
              <Button disabled={securityBusy} onPress={/* EN: Opens confirmation before restoring suspended account access. / UK: Відкриває підтвердження перед відновленням доступу до заблокованого облікового запису. */ () => setSecurityDialog('unsuspend')}>
                {t('restoreUserAccess')}
              </Button>
            ) : (
              <Button disabled={securityBusy} onPress={/* EN: Resets stale suspension form state before opening a new suspension sheet. / UK: Очищає застарілий стан форми блокування перед відкриттям нового аркуша. */ () => { setBanUntil(defaultSuspensionInput()); setSecurityError(''); setBanOpen(true); }}>
                {t('suspendUser')}
              </Button>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('userStatistics')}</Text>
        <View style={styles.infoGrid}>
          <View style={styles.statItem}><Text style={styles.statValue}>{stats.completedWorkoutCount}</Text><Text style={styles.infoLabel}>{t('completedWorkouts')}</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{durationLabel(stats.totalDurationSeconds, t)}</Text><Text style={styles.infoLabel}>{t('totalTrainingTime')}</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{stats.personalProgramCount}</Text><Text style={styles.infoLabel}>{t('personalPrograms')}</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{stats.scheduledWorkoutCount}</Text><Text style={styles.infoLabel}>{t('scheduledWorkouts')}</Text></View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('userActivity')}</Text>
        <View style={styles.filters}>
          {filters.map(/* EN: Builds one selectable control for each supported audit category. / UK: Створює один елемент вибору для кожної підтримуваної категорії аудиту. */ (item) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: filter === item }}
              key={item}
              onPress={/* EN: Applies this category to the memoized activity view. / UK: Застосовує цю категорію до запам'ятованого подання активності. */ () => setFilter(item)}
              style={[styles.filter, filter === item && styles.filterActive]}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {t(`activityFilter_${item}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Feedback error={error} />
        <View style={styles.timeline}>
          {visibleActivity.map(/* EN: Converts each audit record into localized timeline content and occurrence time. / UK: Перетворює кожен запис аудиту на локалізований вміст часової шкали й час події. */ (event) => {
            const [title, meta] = activityCopy(event, t);
            return (
              <View key={event.id} style={styles.activity}>
                <View style={styles.activityMarker} />
                <View style={styles.activityBody}>
                  <Text style={styles.activityTitle}>{title}</Text>
                  {!!meta && <Text style={styles.activityMeta}>{meta}</Text>}
                  <Text style={styles.activityMeta}>{dateTime(event.occurredAt)}</Text>
                </View>
              </View>
            );
          })}
          {!visibleActivity.length && <Text style={styles.empty}>{t('noUserActivity')}</Text>}
        </View>
        {hasMore && (
          <Button secondary disabled={loadingMore} onPress={loadMore}>
            {loadingMore ? t('loading') : t('showMore')}
          </Button>
        )}
      </View>

      <Modal
        animationType="fade"
        onRequestClose={/* EN: Closes the avatar modal for the platform back or dismiss action. / UK: Закриває модальне вікно аватара після системної дії повернення або закриття. */ () => setAvatarOpen(false)}
        transparent
        visible={avatarOpen}
      >
        <Pressable
          accessibilityLabel={t('close')}
          accessibilityRole="button"
          onPress={/* EN: Closes the avatar preview when its backdrop is pressed. / UK: Закриває попередній перегляд аватара після натискання на тло. */ () => setAvatarOpen(false)}
          style={styles.avatarBackdrop}
        >
          <Pressable onPress={/* EN: Stops presses inside the preview from reaching the closing backdrop. / UK: Не дає натисканням усередині перегляду перейти до тла, яке закриває вікно. */ (event) => event.stopPropagation()} style={styles.avatarPreview}>
            <Image resizeMode="contain" source={{ uri: user.avatarUrl }} style={styles.avatarPreviewImage} />
            <Button secondary onPress={/* EN: Closes the avatar preview from its explicit button. / UK: Закриває попередній перегляд аватара окремою кнопкою. */ () => setAvatarOpen(false)}>{t('close')}</Button>
          </Pressable>
        </Pressable>
      </Modal>

      {banOpen && (
        <Sheet title={t('suspendNamedUser', { name: user.username ? `@${user.username}` : user.displayName })} onClose={/* EN: Allows closing the suspension sheet only while no security request is running. / UK: Дозволяє закрити аркуш блокування лише тоді, коли безпековий запит не виконується. */ () => !securityBusy && setBanOpen(false)}>
          <Text style={styles.securityHint}>{t('suspendUserExplanation')}</Text>
          <Field label={t('suspendedUntilInput')} placeholder="2026-10-06 18:00" value={banUntil} onChangeText={setBanUntil} />
          <Field label={t('suspensionReason')} maxLength={500} multiline value={banReason} onChangeText={setBanReason} />
          <Feedback error={securityError} />
          <Button disabled={securityBusy} onPress={suspendUser}>{securityBusy ? t('saving') : t('suspendUser')}</Button>
        </Sheet>
      )}

      <ConfirmDialog
        visible={securityDialog === 'sessions'}
        title={t('revokeUserSessionsConfirmTitle')}
        message={t('revokeUserSessionsConfirmMessage')}
        cancelLabel={t('cancel')}
        confirmLabel={t('revokeUserSessions')}
        onCancel={/* EN: Dismisses session-revocation confirmation only when no action is in flight. / UK: Закриває підтвердження відкликання сесій лише за відсутності активної операції. */ () => !securityBusy && setSecurityDialog(null)}
        onConfirm={revokeSessions}
      />
      <ConfirmDialog
        visible={securityDialog === 'unsuspend'}
        title={t('restoreUserAccessConfirmTitle')}
        message={t('restoreUserAccessConfirmMessage')}
        cancelLabel={t('cancel')}
        confirmLabel={t('restoreUserAccess')}
        onCancel={/* EN: Dismisses access-restoration confirmation only when no action is in flight. / UK: Закриває підтвердження відновлення доступу лише за відсутності активної операції. */ () => !securityBusy && setSecurityDialog(null)}
        onConfirm={unsuspendUser}
      />
    </View>
  );
}
