import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { apiFetch } from '../services/api';

const weekDays = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
};
const weekDayByDateIndex = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  uk: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
};

const parseDate = (value) => new Date(`${value}T12:00:00`);
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const DATE_STRIP_DAYS = 15;
const DATE_CELL_WIDTH = 54;
const DATE_GAP = 8;
const addDays = (date, count) => {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
};

function ProgramCard({ assignment, navigation, showScheduledDate, t, theme, userToken }) {
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    let active = true;
    apiFetch(`/workout-programs/${assignment.programId}`, {}, userToken).then((response) => {
      if (!active || !response.ok) return;
      const unique = response.data.schedule.filter((entry) => entry.exercise).reduce((items, entry) => (
        items.some((exercise) => exercise.id === entry.exercise.id)
          ? items
          : [...items, entry.exercise]
      ), []);
      setPreview(unique);
    });
    return () => { active = false; };
  }, [assignment.programId, userToken]);

  const openDetails = () => navigation.navigate('ProgramDetails', { assignment });
  const visibleExercises = preview.slice(0, 3);
  const hiddenCount = Math.max(0, preview.length - visibleExercises.length);

  return (
    <View style={[styles.programCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <Pressable onPress={openDetails}>
        <View style={styles.programTop}>
          <Text style={[styles.programTitle, { color: theme.textPrimary }]}>{assignment.programName}</Text>
          <View style={[styles.status, styles[`status_${assignment.status}`]]}><Text style={styles.statusText}>{t(`scheduleStatus_${assignment.status}`)}</Text></View>
        </View>
        {showScheduledDate && <Text style={[styles.scheduledDate, { color: theme.textSecondary }]}>{assignment.scheduledFor}</Text>}
        {!!assignment.programDescription && <Text style={[styles.description, { color: theme.textSecondary }]}>{assignment.programDescription}</Text>}
        <View style={styles.exercisePreview}>
          {visibleExercises.map((exercise) => (
            <View key={exercise.id} style={[styles.exerciseChip, { borderColor: theme.border }]}>
              <Text numberOfLines={1} style={[styles.exerciseChipText, { color: theme.textSecondary }]}>{exercise.name}</Text>
            </View>
          ))}
          {hiddenCount > 0 && <View style={[styles.exerciseChip, { borderColor: theme.primary }]}><Text style={[styles.exerciseChipText, { color: theme.primary }]}>+{hiddenCount}</Text></View>}
        </View>
      </Pressable>
      <Pressable onPress={openDetails} style={[styles.secondaryAction, { borderColor: theme.primary }]}>
        <Text style={[styles.secondaryActionText, { color: theme.primary }]}>{t('viewProgram')}</Text>
      </Pressable>
    </View>
  );
}

export default function TrainingScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [assignments, setAssignments] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState({ start: null, end: null });
  const [dateStripWidth, setDateStripWidth] = useState(0);
  const dateStripRef = useRef(null);
  const { start: rangeStart, end: rangeEnd } = range;

  const loadSchedule = useCallback(async () => {
    const from = dateKey(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    const to = dateKey(new Date(month.getFullYear(), month.getMonth() + 2, 0));
    setLoading(true);
    const response = await apiFetch(`/workout-programs/schedule?from=${from}&to=${to}`, {}, userToken);
    if (response.ok) {
      setAssignments(response.data || []);
      setError(null);
    } else {
      setError(response.data?.message || t('scheduleLoadError'));
    }
    setLoading(false);
  }, [month, t, userToken]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const selected = parseDate(selectedDate);
  const nearbyDates = useMemo(() => Array.from(
    { length: DATE_STRIP_DAYS },
    (_, index) => addDays(selected, index - Math.floor(DATE_STRIP_DAYS / 2)),
  ), [selectedDate]);
  const selectedAssignments = assignments.filter((item) => (
    rangeStart && rangeEnd
      ? item.scheduledFor >= rangeStart && item.scheduledFor <= rangeEnd
      : item.scheduledFor === selectedDate
  ));
  const assignedDates = new Set(assignments.map((item) => item.scheduledFor));
  const isInRange = (key) => rangeStart && key >= rangeStart && (!rangeEnd ? key === rangeStart : key <= rangeEnd);

  useEffect(() => {
    if (!dateStripWidth) return;
    const selectedIndex = Math.floor(DATE_STRIP_DAYS / 2);
    const offset = selectedIndex * (DATE_CELL_WIDTH + DATE_GAP) + DATE_CELL_WIDTH / 2 - dateStripWidth / 2;
    dateStripRef.current?.scrollTo({ x: Math.max(0, offset), animated: false });
  }, [dateStripWidth, selectedDate]);

  const chooseDate = (date) => {
    setSelectedDate(dateKey(date));
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setRange({ start: null, end: null });
  };

  const chooseRangeDate = (date) => {
    const key = dateKey(date);
    setSelectedDate(key);
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));

    setRange((current) => {
      if (!current.start || current.end) return { start: key, end: null };
      return key < current.start
        ? { start: key, end: current.start }
        : { start: current.start, end: key };
    });
  };

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const calendarStart = addDays(firstDay, -((firstDay.getDay() + 6) % 7));
  const calendarDays = Array.from({ length: 42 }, (_, index) => addDays(calendarStart, index));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>{t('trainingPlan').toUpperCase()}</Text>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{t('training')}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('openCalendar')} onPress={() => setCalendarOpen(true)} style={[styles.calendarButton, { borderColor: theme.border }]}>
            <Text style={[styles.calendarIcon, { color: theme.textPrimary }]}>▦</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setCalendarOpen(true)}>
          <Text style={[styles.selectedDate, { color: theme.textPrimary }]}>{selected.toLocaleDateString(localeTag, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </Pressable>

        <ScrollView
          horizontal
          onLayout={(event) => setDateStripWidth(event.nativeEvent.layout.width)}
          ref={dateStripRef}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
        >
          {nearbyDates.map((date) => {
            const key = dateKey(date);
            const active = key === selectedDate || isInRange(key);
            return (
              <Pressable key={key} onPress={() => chooseDate(date)} style={[styles.dateCell, { borderColor: theme.border }, active && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                <Text style={[styles.dayName, { color: active ? '#fff' : theme.textSecondary }]}>{weekDayByDateIndex[locale][date.getDay()]}</Text>
                <Text style={[styles.dayNumber, { color: active ? '#fff' : theme.textPrimary }]}>{date.getDate()}</Text>
                {assignedDates.has(key) && <View style={[styles.dot, { backgroundColor: active ? '#fff' : theme.secondary }]} />}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('scheduledPrograms')}</Text>
          <Text style={{ color: theme.textSecondary }}>{selectedAssignments.length}</Text>
        </View>

        {loading ? <ActivityIndicator color={theme.primary} /> : selectedAssignments.map((assignment) => (
          <ProgramCard
            assignment={assignment}
            key={assignment.id}
            navigation={navigation}
            t={t}
            theme={theme}
            userToken={userToken}
            showScheduledDate={!!rangeEnd}
          />
        ))}

        {!loading && !selectedAssignments.length && (
          <View style={[styles.empty, { borderColor: theme.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{t('noScheduledWorkouts')}</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>{t('scheduleEmptyHint')}</Text>
            <Pressable onPress={() => navigation.getParent()?.navigate('Home')}><Text style={[styles.link, { color: theme.primary }]}>{t('openWorkshop')}</Text></Pressable>
          </View>
        )}
        {!!error && <Text style={{ color: theme.error }}>{error}</Text>}
      </ScrollView>

      <Modal visible={calendarOpen} transparent animationType="fade" onRequestClose={() => setCalendarOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.monthHeader}>
              <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Text style={[styles.monthArrow, { color: theme.textPrimary }]}>‹</Text></Pressable>
              <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>{month.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })}</Text>
              <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Text style={[styles.monthArrow, { color: theme.textPrimary }]}>›</Text></Pressable>
            </View>
            <Text style={[styles.rangeHint, { color: theme.textSecondary }]}>{locale === 'uk' ? 'Оберіть початкову та кінцеву дату' : 'Select a start and end date'}</Text>
            <View style={styles.weekHeader}>{weekDays[locale].map((day) => <Text key={day} style={[styles.weekLabel, { color: theme.textSecondary }]}>{day}</Text>)}</View>
            <View style={styles.monthGrid}>{calendarDays.map((date) => {
              const key = dateKey(date);
              const active = isInRange(key);
              const rangeStartDay = key === rangeStart;
              const rangeEndDay = key === rangeEnd || (rangeStart === key && !rangeEnd);
              const inMonth = date.getMonth() === month.getMonth();
              return <Pressable key={key} onPress={() => chooseRangeDate(date)} style={styles.monthDay}>
                {active && <View style={[styles.rangeFill, { backgroundColor: theme.primary }, rangeStartDay && styles.rangeStart, rangeEndDay && styles.rangeEnd]} />}
                <Text style={[styles.monthDayText, { color: active ? '#fff' : inMonth ? theme.textPrimary : theme.textSecondary }]}>{date.getDate()}</Text>
                {assignedDates.has(key) && <View style={[styles.dot, { backgroundColor: active ? '#fff' : theme.secondary }]} />}
              </Pressable>;
            })}</View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => chooseRangeDate(new Date())}><Text style={[styles.link, { color: theme.primary }]}>{t('today')}</Text></Pressable>
              <Pressable onPress={() => setCalendarOpen(false)}><Text style={[styles.link, { color: theme.textPrimary }]}>{t('close')}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: 18, paddingBottom: 120 }, header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }, title: { fontSize: 30, fontWeight: '900' }, calendarButton: { alignItems: 'center', borderRadius: 12, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 }, calendarIcon: { fontSize: 24 }, selectedDate: { fontSize: 16, fontWeight: '700', marginTop: 18, textTransform: 'capitalize' }, dateStrip: { gap: DATE_GAP, paddingVertical: 16 }, dateCell: { alignItems: 'center', borderRadius: 14, borderWidth: 1, height: 74, justifyContent: 'center', width: DATE_CELL_WIDTH }, dayName: { fontSize: 11, fontWeight: '600' }, dayNumber: { fontSize: 20, fontWeight: '800', marginTop: 3 }, dot: { borderRadius: 3, height: 5, marginTop: 4, width: 5 }, sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 6 }, sectionTitle: { fontSize: 19, fontWeight: '800' }, programCard: { borderRadius: 16, borderWidth: 1, gap: 10, marginBottom: 12, padding: 16 }, programTop: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between' }, programTitle: { flex: 1, fontSize: 17, fontWeight: '800' }, scheduledDate: { fontSize: 12, fontWeight: '700' }, description: { fontSize: 13, lineHeight: 19 }, exercisePreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }, exerciseChip: { borderRadius: 999, borderWidth: 1, maxWidth: 150, paddingHorizontal: 9, paddingVertical: 5 }, exerciseChipText: { fontSize: 11, fontWeight: '700' }, secondaryAction: { alignItems: 'center', borderRadius: 10, borderWidth: 1, justifyContent: 'center', padding: 10 }, secondaryActionText: { fontSize: 12, fontWeight: '800' }, status: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 }, status_planned: { backgroundColor: '#1D4ED8' }, status_completed: { backgroundColor: '#15803D' }, status_missed: { backgroundColor: '#991B1B' }, statusText: { color: '#fff', fontSize: 10, fontWeight: '800' }, empty: { alignItems: 'center', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, gap: 8, padding: 28 }, emptyTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' }, link: { fontWeight: '800', padding: 6 }, overlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.72)', flex: 1, justifyContent: 'center', padding: 20 }, modal: { borderRadius: 20, maxWidth: 420, padding: 18, width: '100%' }, monthHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, monthArrow: { fontSize: 34, paddingHorizontal: 12 }, monthTitle: { fontSize: 18, fontWeight: '800', textTransform: 'capitalize' }, rangeHint: { fontSize: 12, marginTop: 6, textAlign: 'center' }, weekHeader: { flexDirection: 'row', marginTop: 10 }, weekLabel: { textAlign: 'center', width: '14.285%' }, monthGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }, monthDay: { alignItems: 'center', height: 46, justifyContent: 'center', position: 'relative', width: '14.285%' }, rangeFill: { bottom: 9, left: 0, position: 'absolute', right: 0, top: 9 }, rangeStart: { borderBottomLeftRadius: 10, borderTopLeftRadius: 10, left: 4 }, rangeEnd: { borderBottomRightRadius: 10, borderTopRightRadius: 10, right: 4 }, monthDayText: { fontWeight: '700', zIndex: 1 }, modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});
