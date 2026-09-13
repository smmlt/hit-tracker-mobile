import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { DATE_CELL_WIDTH, DATE_GAP, styles } from './TrainingScreen.styles.js';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { apiFetch } from '../services/api';
import { calendarDaySelection, scheduleCardTone } from '../utils/scheduleCard';
import { programDifficulty } from '../utils/library';
import { DifficultyIndicator } from '../components/exercise/DifficultyIndicator';
import { useWords } from '../components/workshop/ui';

import { palette } from '../constants/colors';
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
const addDays = (date, count) => {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
};

function ProgramCard({ assignment, navigation, t, theme, userToken, localeTag }) {
  const w = useWords();
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    let active = true;
    apiFetch(`/workout-programs/${assignment.programId}`, {}, userToken).then((response) => {
      if (!active || !response.ok) return;
      setSchedule(response.data.schedule.filter((entry) => entry.exercise));
    });
    return () => { active = false; };
  }, [assignment.programId, userToken]);

  const preview = useMemo(() => schedule.reduce((items, entry) => (
    items.some((exercise) => exercise.id === entry.exercise.id)
      ? items
      : [...items, entry.exercise]
  ), []), [schedule]);
  const difficulty = programDifficulty(schedule);

  const openDetails = () => navigation.navigate('ProgramDetails', { assignment });
  const tone = scheduleCardTone(assignment);
  const statusColor = {
    planned: palette.accent,
    completed: palette.greenBright,
    missed: palette.orange,
    completedLate: palette.grayLegacy,
  }[tone];
  const statusLabel = tone === 'completedLate'
    ? `${t('scheduleStatus_completed')} ${new Date(assignment.completedAt).toLocaleDateString(localeTag, { day: 'numeric', month: 'long' })}`
    : t(`scheduleStatus_${assignment.status}`);

  return (
    <Pressable
      accessibilityLabel={`${t('viewProgram')}: ${assignment.programName}`}
      accessibilityRole="button"
      onPress={openDetails}
      style={({ pressed }) => [styles.programCard, { backgroundColor: theme.cardBackground, borderLeftColor: statusColor }, pressed && styles.programCardPressed]}
    >
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: theme.textSecondary }]}>{statusLabel}</Text>
      </View>
      <Text numberOfLines={1} style={[styles.programTitle, { color: theme.textPrimary }]}>{assignment.programName}</Text>
      {!!preview.length && (
        <View style={styles.programMeta}>
          {difficulty && (
            <View style={[styles.metaChip, styles.difficultyChip, { backgroundColor: theme.background }]}>
              <Text style={[styles.metaChipText, { color: theme.textSecondary }]}>
                {w[`difficultyLevel${difficulty.level}`]}
              </Text>
              <DifficultyIndicator difficulty={difficulty.level} />
            </View>
          )}
          <View style={[styles.metaChip, { backgroundColor: theme.background }]}>
            <Text style={[styles.metaChipText, { color: theme.textSecondary }]}>{preview.length} {t('exercisesShort')}</Text>
          </View>
        </View>
      )}
      <View style={[styles.secondaryAction, { borderColor: statusColor }]}>
        <Text style={[styles.secondaryActionText, { color: statusColor }]}>{t('viewProgram')}</Text>
      </View>
    </Pressable>
  );
}

export default function TrainingScreen({ navigation }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { userToken } = useContext(AuthContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [assignments, setAssignments] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [programPickerOpen, setProgramPickerOpen] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [repeatWeekly, setRepeatWeekly] = useState(true);
  const [schedulingId, setSchedulingId] = useState(null);
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

  useFocusEffect(useCallback(() => { loadSchedule(); }, [loadSchedule]));

  const openProgramPicker = async () => {
    setProgramPickerOpen(true);
    setProgramsLoading(true);
    const response = await apiFetch('/workout-programs', {}, userToken);
    if (response.ok) {
      setPrograms(response.data || []);
      setError(null);
    } else {
      setError(response.data?.message || t('programLoadError'));
    }
    setProgramsLoading(false);
  };

  const addProgramToPlan = async (program) => {
    setSchedulingId(program.id);
    const response = await apiFetch('/workout-programs/schedule', {
      method: 'POST',
      body: JSON.stringify({ programId: program.id, scheduledFor: selectedDate, repeat: repeatWeekly ? 'weekly' : 'none' }),
    }, userToken);
    setSchedulingId(null);
    if (response.ok) {
      setProgramPickerOpen(false);
      loadSchedule();
    } else {
      setError(response.data?.message || t('scheduleLoadError'));
    }
  };

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
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>{t('trainingPlan').toUpperCase()}</Text>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{t('training')}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('openCalendar')} onPress={() => setCalendarOpen(true)} style={[styles.calendarButton, { borderColor: theme.border }]}>
            <Ionicons color={theme.textPrimary} name="calendar-outline" size={22} />
          </Pressable>
        </View>

        <Pressable onPress={() => setCalendarOpen(true)}>
          <Text style={[styles.selectedDate, { color: theme.textPrimary }]}>{selected.toLocaleDateString(localeTag, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </Pressable>

        <Pressable onPress={openProgramPicker} style={[styles.addProgramButton, { borderColor: theme.primary }]}>
          <Text style={[styles.addProgramText, { color: theme.primary }]}>{t('addProgram')}</Text>
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
                <Text style={[styles.dayName, { color: active ? palette.whitePure : theme.textSecondary }]}>{weekDayByDateIndex[locale][date.getDay()]}</Text>
                <Text style={[styles.dayNumber, { color: active ? palette.whitePure : theme.textPrimary }]}>{date.getDate()}</Text>
                {assignedDates.has(key) && <View style={[styles.dot, { backgroundColor: active ? palette.whitePure : theme.secondary }]} />}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('scheduledPrograms')}</Text>
          <Text style={[styles.assignmentCount, { color: theme.textSecondary }]}>{selectedAssignments.length}</Text>
        </View>

        {loading ? <ActivityIndicator color={theme.primary} /> : selectedAssignments.map((assignment) => (
          <ProgramCard
            assignment={assignment}
            key={assignment.id}
            navigation={navigation}
            t={t}
            theme={theme}
            userToken={userToken}
            localeTag={localeTag}
          />
        ))}

        {!loading && !selectedAssignments.length && (
          <View style={[styles.empty, { borderColor: theme.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{t('noScheduledWorkouts')}</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>{t('scheduleEmptyHint')}</Text>
            <Pressable onPress={() => navigation.getParent()?.navigate('Home')}><Text style={[styles.link, { color: theme.primary }]}>{t('openWorkshop')}</Text></Pressable>
          </View>
        )}
        {!!error && <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>}
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
              const {
                active,
                startsSelection: rangeStartDay,
                endsSelection: rangeEndDay,
              } = calendarDaySelection(key, selectedDate, rangeStart, rangeEnd);
              const inMonth = date.getMonth() === month.getMonth();
              return <Pressable key={key} onPress={() => chooseRangeDate(date)} style={styles.monthDay}>
                {active && <View style={[styles.rangeFill, { backgroundColor: theme.primary }, rangeStartDay && styles.rangeStart, rangeEndDay && styles.rangeEnd]} />}
                <Text style={[styles.monthDayText, { color: active ? palette.whitePure : inMonth ? theme.textPrimary : theme.textSecondary }]}>{date.getDate()}</Text>
                {assignedDates.has(key) && <View style={[styles.dot, { backgroundColor: active ? palette.whitePure : theme.secondary }]} />}
              </Pressable>;
            })}</View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => chooseRangeDate(new Date())}><Text style={[styles.link, { color: theme.primary }]}>{t('today')}</Text></Pressable>
              <Pressable onPress={() => setCalendarOpen(false)}><Text style={[styles.link, { color: theme.textPrimary }]}>{t('close')}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={programPickerOpen} transparent animationType="fade" onRequestClose={() => setProgramPickerOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>{t('chooseProgram')}</Text>
            <Text style={[styles.rangeHint, { color: theme.textSecondary }]}>{t('addProgramHint')} {selectedDate}</Text>
            <View style={styles.repeatPicker}>
              <Pressable onPress={() => setRepeatWeekly(true)} style={[styles.repeatOption, { borderColor: theme.border }, repeatWeekly && { backgroundColor: theme.primary, borderColor: theme.primary }]}><Text style={[styles.repeatText, { color: repeatWeekly ? palette.whitePure : theme.textPrimary }]}>{t('everyWeek')}</Text></Pressable>
              <Pressable onPress={() => setRepeatWeekly(false)} style={[styles.repeatOption, { borderColor: theme.border }, !repeatWeekly && { backgroundColor: theme.primary, borderColor: theme.primary }]}><Text style={[styles.repeatText, { color: !repeatWeekly ? palette.whitePure : theme.textPrimary }]}>{t('onlyThisDay')}</Text></Pressable>
            </View>
            {programsLoading ? <ActivityIndicator color={theme.primary} style={styles.modalSpinner} /> : <ScrollView style={styles.programPickerList}>{programs.map((program) => (
              <Pressable disabled={schedulingId !== null} key={program.id} onPress={() => addProgramToPlan(program)} style={[styles.pickerProgram, { borderColor: theme.border }]}>
                <Text style={[styles.programTitle, { color: theme.textPrimary }]}>{schedulingId === program.id ? '…' : program.name}</Text>
                {!!program.description && <Text numberOfLines={2} style={[styles.description, { color: theme.textSecondary }]}>{program.description}</Text>}
              </Pressable>
            ))}</ScrollView>}
            <View style={styles.modalActions}><View /><Pressable onPress={() => setProgramPickerOpen(false)}><Text style={[styles.link, { color: theme.textPrimary }]}>{t('close')}</Text></Pressable></View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
