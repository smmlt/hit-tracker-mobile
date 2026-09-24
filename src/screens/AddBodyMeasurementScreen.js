import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { CustomToast } from '../components/feedback';
import { bodyMetricsService } from '../services/bodyMetricsService';
import { dateInputToIso, dateKey, validateBodyMeasurement } from '../utils/bodyMetrics';
import { createStyles } from './AddBodyMeasurementScreen.styles';

const FIELDS = [
  ['weight', 'bodyMetricsWeight', 'kgShort'],
  ['bodyFatPercentage', 'bodyMetricsFat', 'percentageShort'],
  ['muscleMass', 'bodyMetricsMuscle', 'kgShort'],
  ['waistCircumference', 'bodyMetricsWaist', 'cmShort'],
];

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

function calendarDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export default function AddBodyMeasurementScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const today = new Date();
  const todayKey = dateKey(today);
  const [form, setForm] = useState({ weight: '', bodyFatPercentage: '', muscleMass: '', waistCircumference: '', recordedAt: todayKey });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastTimer = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const days = useMemo(() => calendarDays(month), [month]);
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
  const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(() => setToast((current) => ({ ...current, visible: false })), 1800);
  };

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const serverErrorMessage = (requestError) => {
    const code = requestError.details?.code || requestError.details?.errorCode;
    if (code === 'BODY_METRIC_REQUIRED') return t('bodyMetricRequired');
    if (code === 'BODY_METRIC_FUTURE_DATE') return t('bodyMetricFutureDate');
    if (code === 'INVALID_PERIOD') return t('bodyMetricInvalidPeriod');
    if (code === 'BODY_METRIC_OUT_OF_RANGE') {
      const fieldKeys = { weight: 'bodyMetricsWeight', bodyFatPercentage: 'bodyMetricsFat', muscleMass: 'bodyMetricsMuscle', waistCircumference: 'bodyMetricsWaist' };
      const messages = (requestError.details?.details || []).map((detail) => t('bodyMetricOutOfRange', { field: t(fieldKeys[detail.field] || 'bodyMetrics'), min: detail.min, max: detail.max }));
      if (messages.length) return messages.join('\n');
      return t('bodyMetricInvalid');
    }
    return requestError.status >= 400 && requestError.status < 500 ? t('bodyMetricInvalid') : t('bodyMetricsSaveFailed');
  };

  const submit = async () => {
    const validation = validateBodyMeasurement(form);
    if (!validation.valid) {
      if (validation.errors.required) return setError(t('bodyMetricRequired'));
      if (validation.errors.futureDate) return setError(t('bodyMetricFutureDate'));
      return setError(t('bodyMetricInvalid'));
    }
    setLoading(true);
    setError('');
    const data = Object.fromEntries(FIELDS.filter(([key]) => form[key] !== '').map(([key]) => [key, Number(String(form[key]).replace(',', '.'))]));
    data.recordedAt = dateInputToIso(form.recordedAt);
    try {
      await bodyMetricsService.add(userToken, data);
      showToast(t('measurementSaved'));
      setTimeout(() => navigation.goBack(), 700);
    } catch (requestError) {
      setError(serverErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: width < 390 ? 14 : 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons color={theme.textPrimary} name="arrow-back" size={24} /></Pressable>
          <Text accessibilityRole="header" style={styles.title}>{t('addMeasurement')}</Text>
          <View style={styles.backButton} />
        </View>
        <Text style={styles.hint}>{t('bodyMetricRequired')}</Text>
        {FIELDS.map(([key, labelKey, unit]) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{t(labelKey)} ({t(unit)})</Text>
            <TextInput accessibilityLabel={t(labelKey)} keyboardType="decimal-pad" onBlur={() => setFocusedField('')} onChangeText={update(key)} onFocus={() => setFocusedField(key)} placeholder={t('bodyMetricsValuePlaceholder')} placeholderTextColor={theme.textSecondary} style={[styles.input, focusedField === key && styles.inputFocused]} value={form[key]} />
          </View>
        ))}
        <Text style={styles.label}>{t('measurementDate')}</Text>
        <Pressable accessibilityRole="button" onPress={() => setCalendarOpen(true)} style={({ focused, hovered, pressed }) => [styles.dateButton, (focused || hovered) && styles.interactive, pressed && styles.pressed]}>
          <Text style={styles.dateText}>{new Date(`${form.recordedAt}T12:00:00`).toLocaleDateString(localeTag, { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          <Ionicons color={theme.textSecondary} name="calendar-outline" size={21} />
        </Pressable>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={loading} onPress={submit} style={({ focused, hovered, pressed }) => [styles.submit, loading && styles.disabled, (focused || hovered) && styles.interactive, pressed && styles.pressed]}>
          {loading ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={styles.submitText}>{t('save')}</Text>}
        </Pressable>
      </ScrollView>
      <CustomToast fadeAnim={fadeAnim} message={toast.message} onClose={() => setToast((current) => ({ ...current, visible: false }))} type={toast.type} visible={toast.visible} />

      <Modal animationType="fade" onRequestClose={() => setCalendarOpen(false)} transparent visible={calendarOpen}>
        <View style={styles.overlay}>
          <View style={styles.calendarModal}>
            <Text style={styles.calendarTitle}>{t('measurementDate')}</Text>
            <View style={styles.monthHeader}>
              <Pressable accessibilityLabel={t('previous')} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.monthArrow}><Ionicons color={theme.textPrimary} name="chevron-back" size={22} /></Pressable>
              <Text style={styles.monthTitle}>{month.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })}</Text>
              <Pressable accessibilityLabel={t('next')} disabled={monthKey >= currentMonthKey} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={[styles.monthArrow, monthKey >= currentMonthKey && styles.disabled]}><Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /></Pressable>
            </View>
            <View style={styles.weekHeader}>{['weekdayMon', 'weekdayTue', 'weekdayWed', 'weekdayThu', 'weekdayFri', 'weekdaySat', 'weekdaySun'].map((key) => <Text key={key} style={styles.weekLabel}>{t(key)}</Text>)}</View>
            <View style={styles.monthGrid}>{days.map((day) => {
              const key = dateKey(day);
              const disabled = key > todayKey || day.getMonth() !== month.getMonth();
              return <Pressable accessibilityLabel={day.toLocaleDateString(localeTag)} disabled={disabled} key={key} onPress={() => { setForm((current) => ({ ...current, recordedAt: key })); setCalendarOpen(false); }} style={styles.monthDay}>
                <Text style={[styles.monthDayText, disabled && styles.disabled, key === form.recordedAt && styles.activeDayText]}>{day.getDate()}</Text>
              </Pressable>;
            })}</View>
            <Pressable accessibilityRole="button" onPress={() => setCalendarOpen(false)} style={styles.closeButton}><Text style={styles.cancelText}>{t('cancel')}</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
