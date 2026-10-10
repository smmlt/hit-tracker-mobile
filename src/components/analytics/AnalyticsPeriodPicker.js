import React, { useContext, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LanguageContext } from '../../localization/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAnalyticsPeriod } from '../../context/AnalyticsPeriodContext';
import { dateKey, formatRangeLabel, periodToDateRange } from '../../utils/bodyMetrics';
import { createStyles } from './AnalyticsPeriodPicker.styles';

const PERIODS = [
  ['today', 'bodyMetricsPeriodToday'],
  ['7', 'bodyMetricsPeriod7'],
  ['14', 'bodyMetricsPeriod14'],
  ['1m', 'bodyMetricsPeriod1m'],
  ['3m', 'bodyMetricsPeriod3m'],
];

function monthCalendar(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function selectRange(current, value) {
  if (!current.start || current.end) return { start: value, end: null };
  return value < current.start
    ? { start: value, end: current.start }
    : { start: current.start, end: value };
}

export default function AnalyticsPeriodPicker({ compact = false }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const { period, setPeriod } = useAnalyticsPeriod();
  const today = new Date();
  const todayKey = dateKey(today);
  const range = useMemo(() => periodToDateRange(period), [period]);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [pending, setPending] = useState({ start: range.start, end: range.end });
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const days = useMemo(() => monthCalendar(month), [month]);
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const canMoveNext = nextMonth <= new Date(today.getFullYear(), today.getMonth(), 1);

  const showCalendar = () => {
    setPending({ start: range.start, end: range.end });
    setMonth(new Date(Number(range.end.slice(0, 4)), Number(range.end.slice(5, 7)) - 1, 1));
    setOpen(true);
  };
  const apply = () => {
    if (!pending.start) return;
    setPeriod({ start: pending.start, end: pending.end || pending.start });
    setOpen(false);
  };

  return <>
    <ScrollView contentContainerStyle={styles.periodRow} horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
      {PERIODS.map(([value, key]) => {
        const selected = period === value;
        return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} key={value} onPress={() => setPeriod(value)} style={[styles.periodChip, selected && styles.periodChipActive]}>
          <Text style={[styles.periodText, selected && styles.periodTextActive]}>{t(key)}</Text>
        </Pressable>;
      })}
      <Pressable accessibilityLabel={t('selectDateOrPeriod')} accessibilityRole="button" onPress={showCalendar} style={[styles.calendarButton, typeof period === 'object' && styles.calendarButtonActive]}>
        <Ionicons color={typeof period === 'object' ? theme.onPrimary : theme.textSecondary} name="calendar-outline" size={22} />
      </Pressable>
    </ScrollView>
    {!compact && <Text style={styles.rangeLabel}>{formatRangeLabel(range, locale)}</Text>}
    <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{t('selectDateOrPeriod')}</Text>
          <Text style={styles.hint}>{t('bodyMetricsCalendarHint')}</Text>
          <View style={styles.monthHeader}>
            <Pressable accessibilityLabel={t('previous')} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.arrow}><Ionicons color={theme.textPrimary} name="chevron-back" size={22} /></Pressable>
            <Text style={styles.monthTitle}>{month.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })}</Text>
            <Pressable accessibilityLabel={t('next')} disabled={!canMoveNext} onPress={() => setMonth(nextMonth)} style={[styles.arrow, !canMoveNext && styles.disabled]}><Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /></Pressable>
          </View>
          <View style={styles.weekRow}>{['weekdayMon', 'weekdayTue', 'weekdayWed', 'weekdayThu', 'weekdayFri', 'weekdaySat', 'weekdaySun'].map((key) => <Text key={key} style={styles.weekday}>{t(key)}</Text>)}</View>
          <View style={styles.grid}>{days.map((day) => {
            const key = dateKey(day);
            const inMonth = day.getMonth() === month.getMonth();
            const future = key > todayKey;
            const selected = key === pending.start || key === pending.end || (pending.start && pending.end && key > pending.start && key < pending.end);
            const isStart = key === pending.start;
            const isEnd = key === (pending.end || pending.start);
            return <Pressable accessibilityLabel={day.toLocaleDateString(localeTag)} disabled={!inMonth || future} key={key} onPress={() => setPending((current) => selectRange(current, key))} style={styles.day}>
              {selected && <View style={[styles.rangeFill, isStart && styles.rangeStart, isEnd && styles.rangeEnd]} />}
              <Text style={[styles.dayText, (!inMonth || future) && styles.disabledText, selected && styles.dayTextSelected]}>{day.getDate()}</Text>
            </Pressable>;
          })}</View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.action}><Text style={styles.cancel}>{t('cancel')}</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={!pending.start} onPress={apply} style={[styles.apply, !pending.start && styles.disabled]}><Text style={styles.applyText}>{t('apply')}</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  </>;
}
