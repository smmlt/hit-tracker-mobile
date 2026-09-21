import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, Text, View } from 'react-native';

import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../localization/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';
import { Button, Feedback } from '../workshop/ui';
import { palette } from '../../constants/colors';
import { createStyles } from './AdminUserDetails.styles';

const filters = ['all', 'account', 'profile', 'training', 'programs', 'access'];

const displayValue = (value, fallback) =>
  value === null || value === undefined || value === '' ? fallback : String(value);

function durationLabel(seconds, t) {
  const totalMinutes = Math.max(0, Math.round(Number(seconds || 0) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [hours ? `${hours} ${t('hourShort')}` : '', minutes || !hours ? `${minutes} ${t('minuteShort')}` : '']
    .filter(Boolean)
    .join(' ');
}

function changeLabel(change, t) {
  const label = t(`adminField_${change.field}`);
  return `${label}: ${displayValue(change.from, t('notSpecified'))} → ${displayValue(change.to, t('notSpecified'))}`;
}

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
        Array.isArray(data.changes) ? data.changes.map((change) => changeLabel(change, t)).join(' · ') : '',
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

function InfoItem({ label, value, styles }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text selectable style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function AdminUserDetails({ userId, revision, onBack, onManage, manageDisabled }) {
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

  const load = useCallback(async () => {
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

  useEffect(() => {
    load();
  }, [load, revision]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await adminService.getUserActivity(userId, nextPage, userToken);
      setActivity((current) => [...current, ...result.items]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const visibleActivity = useMemo(
    () => activity.filter((event) => filter === 'all' || event.category === filter),
    [activity, filter],
  );

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
  const dateTime = (value) => value
    ? new Date(value).toLocaleString(localeTag, { dateStyle: 'medium', timeStyle: 'short' })
    : t('notSpecified');

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Button secondary onPress={onBack}>{t('backToUsers')}</Button>
        <Button secondary disabled={manageDisabled} onPress={() => onManage(user)}>
          {t('manage')}
        </Button>
      </View>

      <View style={styles.hero}>
        <View style={styles.identity}>
          {user.avatarUrl ? (
            <Pressable
              accessibilityLabel={t('viewAvatar')}
              accessibilityRole="button"
              onPress={() => setAvatarOpen(true)}
              style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
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
          {filters.map((item) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: filter === item }}
              key={item}
              onPress={() => setFilter(item)}
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
          {visibleActivity.map((event) => {
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
        onRequestClose={() => setAvatarOpen(false)}
        transparent
        visible={avatarOpen}
      >
        <Pressable
          accessibilityLabel={t('close')}
          accessibilityRole="button"
          onPress={() => setAvatarOpen(false)}
          style={styles.avatarBackdrop}
        >
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.avatarPreview}>
            <Image resizeMode="contain" source={{ uri: user.avatarUrl }} style={styles.avatarPreviewImage} />
            <Button secondary onPress={() => setAvatarOpen(false)}>{t('close')}</Button>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
