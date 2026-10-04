import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './SettingsScreen.styles.js';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { notificationService, syncPushRegistration } from '../services/notificationService';
import { authService } from '../services/authService';

const Toggle = ({ label, value, onChange, theme }) => (
  <View style={styles.row}>
    <Text style={[styles.rowText, { color: theme.textPrimary }]}>{label}</Text>
    <Switch accessibilityLabel={label} onValueChange={onChange} thumbColor={theme.onPrimary} trackColor={{ false: theme.textSecondary, true: theme.primary }} value={value} />
  </View>
);

const Choice = ({ options, value, onChange, theme }) => (
  <View style={[styles.segment, { borderColor: theme.textPrimary }]}>
    {options.map((option) => {
      const selected = value === option.value;
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected }}
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.segmentItem, selected && { backgroundColor: theme.primary }]}
        >
          {option.icon ? <Ionicons color={selected ? theme.onPrimary : theme.textSecondary} name={option.icon} size={22} /> : null}
          <Text style={[styles.segmentText, { color: selected ? theme.onPrimary : theme.textSecondary }]}>{option.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

const reminderDays = [1, 2, 3, 4, 5, 6, 0];
const reminderFrequencies = ['daily', 'every_other_day', 'weekly', 'twice_weekly', 'hourly'];

const FrequencyPicker = ({ frequencies, value, onChange, theme, t }) => (
  <View style={styles.frequencyRow}>
    {frequencies.map((frequency) => {
      const selected = value === frequency;
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected }}
          key={frequency}
          onPress={() => onChange(frequency)}
          style={[styles.frequency, { borderColor: selected ? theme.primary : theme.border }, selected && { backgroundColor: theme.primary }]}
        >
          <Text style={[styles.frequencyText, { color: selected ? theme.onPrimary : theme.textPrimary }]}>{t(`reminderFrequency_${frequency}`)}</Text>
        </Pressable>
      );
    })}
  </View>
);

const ReminderEditor = ({ kind, notifications, onFrequencyChange, onTimeChange, onTimeBlur, onDayChange, theme, t }) => {
  const frequency = notifications[`${kind}ReminderFrequency`];
  const days = notifications[`${kind}ReminderDays`] || [];
  const showDays = ['weekly', 'twice_weekly'].includes(frequency);
  const frequencies = kind === 'workout' ? ['scheduled', ...reminderFrequencies] : reminderFrequencies;
  return (
    <View style={[styles.scheduleCard, { borderColor: theme.border }]}>
      <Text style={[styles.scheduleTitle, { color: theme.textPrimary }]}>{t(`${kind}ReminderSchedule`)}</Text>
      {kind === 'workout' && frequency === 'scheduled' ? <Text style={[styles.feedback, { color: theme.textSecondary }]}>{t('scheduledWorkoutReminderHint')}</Text> : null}
      <FrequencyPicker frequencies={frequencies} value={frequency} onChange={onFrequencyChange} theme={theme} t={t} />
      <View style={[styles.reminderCard, { borderColor: theme.border }]}>
        <View style={styles.reminderBody}>
          <Text style={[styles.reminderLabel, { color: theme.textSecondary }]}>{t('reminderTime')}</Text>
          <TextInput
            accessibilityLabel={t(`${kind}ReminderTime`)}
            inputMode="numeric"
            maxLength={5}
            onChangeText={onTimeChange}
            onBlur={onTimeBlur}
            placeholder="18:00"
            placeholderTextColor={theme.textSecondary}
            style={[styles.reminderValue, { color: theme.textPrimary }]}
            value={notifications[`${kind}ReminderTime`] || ''}
          />
        </View>
        <Ionicons color={theme.textPrimary} name="time-outline" size={22} />
      </View>
      {showDays ? (
        <>
          <Text style={[styles.reminderLabel, { color: theme.textSecondary }]}>{t('reminderDays')}</Text>
          <View style={styles.daysRow}>
            {reminderDays.map((day) => {
              const selected = days.includes(day);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={day}
                  onPress={() => onDayChange(day)}
                  style={[styles.day, { borderColor: selected ? theme.primary : theme.border }, selected && { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.dayText, { color: selected ? theme.onPrimary : theme.textPrimary }]}>{t(`reminderDay_${day}`)}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
};

export default function SettingsScreen({ navigation }) {
  const { logout, logoutAll, userData, userToken } = useContext(AuthContext);
  const { theme, themeName, toggleTheme } = useTheme();
  const { changeLanguage, locale, t } = useContext(LanguageContext);
  const [notifications, setNotifications] = useState(null);
  const [notificationError, setNotificationError] = useState('');
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const notificationRef = useRef(null);
  const notificationWriteRef = useRef(Promise.resolve());
  const notificationWriteIdRef = useRef(0);
  const notificationPendingRef = useRef(0);
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [mfa, setMfa] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaMessage, setMfaMessage] = useState('');
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState(null);
  const canOpenAdmin = ['moderator', 'admin', 'super_admin'].includes(userData?.role);
  const normalizeNotifications = (preferences) => ({
    ...preferences,
    workoutReminderTime: preferences.workoutReminderTime?.slice(0, 5) || '18:00',
    measurementReminderTime: preferences.measurementReminderTime?.slice(0, 5) || '18:00',
  });
  const persistNotifications = (next) => {
    notificationRef.current = next;
    setNotifications(next);
    setNotificationError('');
    setNotificationMessage('');
    const payload = {
      achievementsEnabled: next.achievementsEnabled,
      generalEnabled: next.generalEnabled,
      measurementRemindersEnabled: next.measurementRemindersEnabled,
      newsEnabled: next.newsEnabled,
      workoutReminderFrequency: next.workoutReminderFrequency,
      workoutReminderTime: next.workoutReminderTime,
      workoutReminderDays: next.workoutReminderDays,
      measurementReminderFrequency: next.measurementReminderFrequency,
      measurementReminderTime: next.measurementReminderTime,
      measurementReminderDays: next.measurementReminderDays,
      workoutRemindersEnabled: next.workoutRemindersEnabled,
      pushEnabled: next.pushEnabled,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    const writeId = ++notificationWriteIdRef.current;
    notificationPendingRef.current += 1;
    setNotificationBusy(true);
    const write = notificationWriteRef.current
      .catch(() => {})
      .then(async () => {
        try {
          const confirmed = normalizeNotifications(await notificationService.updatePreferences(payload, userToken));
          if (writeId === notificationWriteIdRef.current) {
            notificationRef.current = confirmed;
            setNotifications(confirmed);
          }
          return true;
        } catch (error) {
          if (writeId === notificationWriteIdRef.current) {
            setNotificationError(error.message);
            try {
              const confirmed = normalizeNotifications(await notificationService.getPreferences(userToken));
              notificationRef.current = confirmed;
              setNotifications(confirmed);
            } catch (reloadError) {
              setNotificationError(reloadError.message);
            }
          }
          return false;
        }
      })
      .finally(() => {
        notificationPendingRef.current -= 1;
        setNotificationBusy(notificationPendingRef.current > 0);
      });
    notificationWriteRef.current = write;
    return write;
  };
  const setNotification = (key) => (value) => {
    const current = notificationRef.current || notifications;
    void persistNotifications({ ...current, [key]: value });
  };
  const setReminderTime = (key) => (value) => {
    const current = notificationRef.current || notifications;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      setNotifications({ ...current, [key]: value });
      setNotificationError(t('invalidReminderTime'));
      return;
    }
    persistNotifications({ ...current, [key]: value });
  };
  const restoreReminderTime = (key) => () => {
    const confirmed = notificationRef.current || notifications;
    const value = confirmed[key] || '18:00';
    setNotifications((current) => ({ ...current, [key]: value }));
    setNotificationError('');
  };
  const loadNotifications = async () => {
    setNotificationError('');
    try {
      const preferences = await notificationService.getPreferences(userToken);
      const normalized = normalizeNotifications(preferences);
      notificationRef.current = normalized;
      setNotifications(normalized);
    } catch (error) {
      setNotificationError(error.message);
    }
  };
  useEffect(() => {
    void loadNotifications();
  }, [userToken]);
  useEffect(() => {
    let active = true;
    authService
      .getMfaStatus(userToken)
      .then((status) => {
        if (active) setMfa(status);
      })
      .catch(() => {
        if (active) setMfaMessage(t('mfaStatusFailed'));
      });
    return () => {
      active = false;
    };
  }, [locale, userToken]);

  const regenerateRecoveryCodes = async () => {
    setMfaBusy(true);
    setMfaMessage('');
    try {
      const result = await authService.regenerateMfaRecoveryCodes(mfaCode.trim(), userToken);
      setMfaRecoveryCodes(result.recoveryCodes);
      setMfaCode('');
      setMfa((current) => ({
        ...current,
        recoveryCodesRemaining: result.recoveryCodes.length,
      }));
    } catch {
      setMfaMessage(t('mfaInvalidCode'));
    } finally {
      setMfaBusy(false);
    }
  };

  const disableMfa = async () => {
    setMfaBusy(true);
    setMfaMessage('');
    try {
      await authService.disableMfa(mfaCode.trim(), userToken);
      setMfa({ required: false, enabled: false, recoveryCodesRemaining: 0 });
      setMfaCode('');
      setMfaMessage(t('mfaDisabled'));
    } catch (error) {
      setMfaMessage(error.details?.code === 'TOTP_REQUIRED_FOR_ROLE' ? t('mfaRequiredForRole') : t('mfaInvalidCode'));
    } finally {
      setMfaBusy(false);
    }
  };

  const togglePush = async (enabled) => {
    setNotificationError('');
    setNotificationMessage('');
    try {
      if (enabled) {
        const registration = await syncPushRegistration(userToken, true);
        if (registration.permissionStatus !== 'granted') throw new Error(t('pushPermissionDenied'));
      } else {
        await notificationService.unregister(userToken).catch(() => {});
      }
      const saved = await persistNotifications({
        ...(notificationRef.current || notifications),
        pushEnabled: enabled,
      });
      if (saved) setNotificationMessage(t(enabled ? 'pushEnabledMessage' : 'pushDisabledMessage'));
    } catch {
      setNotificationError(t('pushSetupFailed'));
    }
  };

  const setReminderFrequency = (kind) => (frequency) => {
    const current = notificationRef.current || notifications;
    const daysKey = `${kind}ReminderDays`;
    const currentDays = current[daysKey] || [1];
    const days =
      frequency === 'weekly' ? [currentDays[0]] : frequency === 'twice_weekly' ? (currentDays.length >= 2 ? currentDays.slice(0, 2) : [currentDays[0], currentDays[0] === 4 ? 1 : 4]) : currentDays;
    void persistNotifications({
      ...current,
      [`${kind}ReminderFrequency`]: frequency,
      [daysKey]: days,
    });
  };

  const toggleReminderDay = (kind, day) => {
    const current = notificationRef.current || notifications;
    {
      const daysKey = `${kind}ReminderDays`;
      const frequency = current[`${kind}ReminderFrequency`];
      const selected = current[daysKey] || [1];
      if (frequency === 'weekly') return void persistNotifications({ ...current, [daysKey]: [day] });
      if (selected.includes(day) && selected.length === 1) return;
      if (frequency === 'twice_weekly' && !selected.includes(day) && selected.length >= 2) {
        return void persistNotifications({
          ...current,
          [daysKey]: [selected[1], day].sort((left, right) => left - right),
        });
      }
      return void persistNotifications({
        ...current,
        [daysKey]: selected.includes(day) ? selected.filter((value) => value !== day) : [...selected, day].sort((left, right) => left - right),
      });
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel={t('back')} onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons color={theme.textPrimary} name="arrow-back" size={24} />
          </Pressable>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{t('settings')}</Text>
        </View>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('language')}</Text>
        <Pressable
          accessibilityLabel={t('language')}
          accessibilityRole="button"
          onPress={() => changeLanguage(locale === 'uk' ? 'en' : 'uk')}
          style={[styles.languageField, { borderColor: theme.textPrimary }]}
        >
          <Text style={[styles.languageText, { color: theme.textPrimary }]}>{locale === 'uk' ? t('ukrainian') : t('english')}</Text>
          <Ionicons color={theme.textPrimary} name="chevron-down" size={22} />
        </Pressable>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('theme')}</Text>
        <Choice
          options={[
            { value: 'light', label: t('light'), icon: 'sunny-outline' },
            { value: 'dark', label: t('dark'), icon: 'moon' },
          ]}
          value={themeName}
          onChange={toggleTheme}
          theme={theme}
        />
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('notifications')}</Text>
        {!notifications ? (
          <View style={styles.notificationState}>
            {notificationError ? (
              <Pressable accessibilityRole="button" onPress={loadNotifications}>
                <Text accessibilityRole="alert" style={[styles.feedback, { color: theme.primary }]}>
                  {notificationError}
                </Text>
                <Text style={[styles.feedback, { color: theme.textPrimary }]}>{t('retry')}</Text>
              </Pressable>
            ) : (
              <ActivityIndicator color={theme.primary} />
            )}
          </View>
        ) : (
          <>
            <Pressable accessibilityRole="button" disabled={notificationBusy} onPress={() => navigation.navigate('Notifications')} style={[styles.action, { borderColor: theme.border }]}>
              <Text style={[styles.actionText, { color: theme.textPrimary }]}>{t('openNotificationInbox')}</Text>
            </Pressable>
            <Toggle label={t('pushNotifications')} value={notifications.pushEnabled} onChange={togglePush} theme={theme} />
            <Toggle label={t('generalNotifications')} value={notifications.generalEnabled} onChange={setNotification('generalEnabled')} theme={theme} />
            <Toggle label={t('workoutReminders')} value={notifications.workoutRemindersEnabled} onChange={setNotification('workoutRemindersEnabled')} theme={theme} />
            <ReminderEditor
              kind="workout"
              notifications={notifications}
              onFrequencyChange={setReminderFrequency('workout')}
              onTimeChange={setReminderTime('workoutReminderTime')}
              onTimeBlur={restoreReminderTime('workoutReminderTime')}
              onDayChange={(day) => toggleReminderDay('workout', day)}
              theme={theme}
              t={t}
            />
            <Toggle label={t('measurementReminders')} value={notifications.measurementRemindersEnabled} onChange={setNotification('measurementRemindersEnabled')} theme={theme} />
            <ReminderEditor
              kind="measurement"
              notifications={notifications}
              onFrequencyChange={setReminderFrequency('measurement')}
              onTimeChange={setReminderTime('measurementReminderTime')}
              onTimeBlur={restoreReminderTime('measurementReminderTime')}
              onDayChange={(day) => toggleReminderDay('measurement', day)}
              theme={theme}
              t={t}
            />
            <Toggle label={t('achievementReminders')} value={notifications.achievementsEnabled} onChange={setNotification('achievementsEnabled')} theme={theme} />
            <Toggle label={t('programNews')} value={notifications.newsEnabled} onChange={setNotification('newsEnabled')} theme={theme} />
            {!!notificationError && (
              <Text accessibilityRole="alert" style={[styles.feedback, { color: theme.primary }]}>
                {notificationError}
              </Text>
            )}
            {!!notificationMessage && (
              <Text accessibilityRole="alert" style={[styles.feedback, { color: theme.textSecondary }]}>
                {notificationMessage}
              </Text>
            )}
          </>
        )}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('units')}</Text>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('weight')}</Text>
        <Choice
          options={[
            { value: 'kg', label: t('kilograms') },
            { value: 'lb', label: t('pounds') },
          ]}
          value={weightUnit}
          onChange={setWeightUnit}
          theme={theme}
        />
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('height')}</Text>
        <Choice
          options={[
            { value: 'cm', label: t('centimeters') },
            { value: 'ft', label: t('feet') },
          ]}
          value={heightUnit}
          onChange={setHeightUnit}
          theme={theme}
        />
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('accountSecurity')}</Text>
        {mfa ? (
          <View style={[styles.securityCard, { borderColor: theme.border }]}>
            <Text style={[styles.rowText, { color: theme.textPrimary }]}>{mfa.enabled ? t('mfaEnabled') : t('mfaDisabledStatus')}</Text>
            {mfa.enabled ? <Text style={[styles.feedback, { color: theme.textSecondary }]}>{t('mfaCodesRemaining', { count: mfa.recoveryCodesRemaining })}</Text> : null}
            {mfa.enabled ? (
              <>
                <TextInput
                  accessibilityLabel={t('authenticatorCode')}
                  inputMode="numeric"
                  maxLength={6}
                  onChangeText={setMfaCode}
                  placeholder="123456"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.securityInput, { borderColor: theme.border, color: theme.textPrimary }]}
                  value={mfaCode}
                />
                <Pressable accessibilityRole="button" disabled={mfaBusy || !/^\d{6}$/.test(mfaCode)} onPress={regenerateRecoveryCodes} style={[styles.action, { borderColor: theme.border }]}>
                  <Text style={[styles.actionText, { color: theme.textPrimary }]}>{t('regenerateRecoveryCodes')}</Text>
                </Pressable>
                {!mfa.required ? (
                  <Pressable accessibilityRole="button" disabled={mfaBusy || !/^\d{6}$/.test(mfaCode)} onPress={disableMfa} style={styles.logout}>
                    <Text style={[styles.logoutText, { color: theme.primary }]}>{t('disableMfa')}</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
            {mfaRecoveryCodes ? (
              <Text selectable style={[styles.recoveryCodes, { color: theme.textPrimary }]}>
                {mfaRecoveryCodes.join('\n')}
              </Text>
            ) : null}
            {!!mfaMessage && (
              <Text accessibilityRole="alert" style={[styles.feedback, { color: theme.primary }]}>
                {mfaMessage}
              </Text>
            )}
          </View>
        ) : (
          <ActivityIndicator color={theme.primary} />
        )}
        <Pressable accessibilityRole="button" onPress={logoutAll} style={[styles.action, { borderColor: theme.border, marginTop: 12 }]}>
          <Text style={[styles.actionText, { color: theme.textPrimary }]}>{t('logoutAllDevices')}</Text>
        </Pressable>
        {canOpenAdmin ? (
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Admin')} style={[styles.admin, { borderColor: theme.primary }]}>
            <Ionicons color={theme.primary} name="shield-checkmark-outline" size={21} />
            <Text style={[styles.adminText, { color: theme.textPrimary }]}>{t('openAdminPanel')}</Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={logout} style={styles.logout}>
          <Text style={[styles.logoutText, { color: theme.primary }]}>{t('logout')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
