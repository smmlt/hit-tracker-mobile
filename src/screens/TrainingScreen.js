/**
 * Browses scheduled training by date, loading assignments and applying calendar/filter transitions before opening program or active-workout flows. / Переглядає заплановані тренування за датою, завантажує призначення та застосовує переходи календаря/фільтрів перед відкриттям програми або активного тренування.
 */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DATE_CELL_WIDTH, DATE_GAP, styles } from './TrainingScreen.styles.js';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { apiFetch } from '../services/api';
import { calendarDaySelection, scheduleCardTone, sortScheduleAssignments } from '../utils/scheduleCard';
import { programDifficulty } from '../utils/library';
import { DifficultyIndicator } from '../components/exercise/DifficultyIndicator';
import { useWords } from '../components/workshop/ui';

import { palette } from '../constants/colors';
import { entityRef } from '../utils/navigationPaths';
const weekDays = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
};
const weekDayByDateIndex = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  uk: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
};

/** EN: Parses a calendar key at midday to avoid timezone shifts. UK: Перетворює календарний ключ на полуденну дату, щоб уникнути зсувів часового поясу. */
const parseDate = (value) => new Date(`${value}T12:00:00`);
/** EN: Serializes a local date as the API's YYYY-MM-DD key. UK: Перетворює локальну дату на ключ YYYY-MM-DD для API. */
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const DATE_STRIP_DAYS = 15;
/** EN: Returns a cloned date shifted by a number of calendar days. UK: Повертає копію дати, зміщену на задану кількість календарних днів. */
const addDays = (date, count) => {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
};

/** EN: Loads and renders a scheduled program preview that opens its details. UK: Завантажує й показує попередній перегляд запланованої програми з переходом до деталей. */
function ProgramCard({ assignment, navigation, t, theme, userToken, localeTag }) {
  const w = useWords();
  const [schedule, setSchedule] = useState([]);

  useEffect(/* EN: Loads the program schedule and ignores a response after unmount. UK: Завантажує розклад програми та ігнорує відповідь після демонтування. */ () => {
    let active = true;
    apiFetch(`/workout-programs/${assignment.programId}`, {}, userToken).then(/* EN: Applies a successful program response while the card remains mounted. UK: Застосовує успішну відповідь програми, поки картка залишається змонтованою. */ (response) => {
      if (!active || !response.ok) return;
      setSchedule(response.data.schedule.filter(/* EN: Keeps only schedule rows linked to an exercise. UK: Залишає лише рядки розкладу, пов’язані з вправою. */ (entry) => entry.exercise));
    });
    return /* EN: Marks the request result stale when the card unmounts. UK: Позначає результат запиту застарілим після демонтування картки. */ () => { active = false; };
  }, [assignment.programId, userToken]);

  const preview = useMemo(/* EN: Builds a stable de-duplicated exercise preview for the card. UK: Формує стабільний попередній список вправ без дублікатів для картки. */ () => schedule.reduce(/* EN: Adds each exercise to the preview only once. UK: Додає кожну вправу до попереднього списку лише один раз. */ (items, entry) => (
    items.some(/* EN: Detects whether the exercise is already present by identifier. UK: Визначає за ідентифікатором, чи вправу вже додано. */ (exercise) => exercise.id === entry.exercise.id)
      ? items
      : [...items, entry.exercise]
  ), []), [schedule]);
  const difficulty = programDifficulty(schedule);

  /** EN: Opens the selected scheduled assignment in program details. UK: Відкриває вибране призначення розкладу в деталях програми. */
  const openDetails = () => navigation.navigate('ProgramDetails', {
    assignmentRef: entityRef(assignment.programName, assignment.id),
    date: assignment.scheduledFor,
  });
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
      style={/* EN: Adds pressed-state styling without changing the card's status color. UK: Додає стиль натискання, не змінюючи колір стану картки. */ ({ pressed }) => [styles.programCard, { backgroundColor: theme.cardBackground, borderLeftColor: statusColor }, pressed && styles.programCardPressed]}
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

/** EN: Coordinates schedule loading, date selection, range filtering, and training navigation. UK: Координує завантаження розкладу, вибір дати, фільтрування діапазону та навігацію тренувань. */
export default function TrainingScreen({ navigation, route }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { userToken } = useContext(AuthContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const today = dateKey(new Date());
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(route.params?.date) ? route.params.date : today;
  const initialSelectedDate = parseDate(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [month, setMonth] = useState(new Date(initialSelectedDate.getFullYear(), initialSelectedDate.getMonth(), 1));
  const [assignments, setAssignments] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState({ start: null, end: null });
  const [dateStripWidth, setDateStripWidth] = useState(0);
  const dateStripRef = useRef(null);
  const { start: rangeStart, end: rangeEnd } = range;

  useEffect(/* EN: Synchronizes local date state when navigation supplies a new date. UK: Синхронізує локальний стан дати, коли навігація передає нову дату. */ () => {
    const routeDate = /^\d{4}-\d{2}-\d{2}$/.test(route.params?.date) ? route.params.date : today;
    if (routeDate !== selectedDate) {
      setSelectedDate(routeDate);
      const next = parseDate(routeDate);
      setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
      setRange({ start: null, end: null });
    }
  }, [route.params?.date, selectedDate, today]);

  const loadSchedule = useCallback(/* EN: Loads a three-month schedule window and exposes loading or error state. UK: Завантажує тримісячне вікно розкладу та оновлює стан завантаження або помилки. */ async () => {
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

  useFocusEffect(useCallback(/* EN: Refreshes the schedule whenever this tab regains focus. UK: Оновлює розклад щоразу, коли ця вкладка знову отримує фокус. */ () => { loadSchedule(); }, [loadSchedule]));

  const selected = parseDate(selectedDate);
  const nearbyDates = useMemo(/* EN: Builds the centered date strip around the selected day. UK: Формує стрічку дат, центровану навколо вибраного дня. */ () => Array.from(
    { length: DATE_STRIP_DAYS },
    /* EN: Maps each strip position to its relative calendar date. UK: Перетворює кожну позицію стрічки на відповідну календарну дату. */ (_, index) => addDays(selected, index - Math.floor(DATE_STRIP_DAYS / 2)),
  ), [selectedDate]);
  const selectedAssignments = sortScheduleAssignments(assignments.filter(/* EN: Keeps assignments inside the chosen range or on the selected day. UK: Залишає призначення в обраному діапазоні або на вибраний день. */ (item) => (
    rangeStart && rangeEnd
      ? item.scheduledFor >= rangeStart && item.scheduledFor <= rangeEnd
      : item.scheduledFor === selectedDate
  )));
  const assignedDates = new Set(assignments.map(/* EN: Extracts scheduled date keys for calendar markers. UK: Витягує ключі запланованих дат для позначок календаря. */ (item) => item.scheduledFor));
  /** EN: Reports whether a date belongs to the current partial or complete range. UK: Визначає, чи належить дата до поточного неповного або завершеного діапазону. */
  const isInRange = (key) => rangeStart && key >= rangeStart && (!rangeEnd ? key === rangeStart : key <= rangeEnd);

  useEffect(/* EN: Recenters the horizontal date strip after its width or selected day changes. UK: Повторно центрує горизонтальну стрічку після зміни її ширини або вибраного дня. */ () => {
    if (!dateStripWidth) return;
    const selectedIndex = Math.floor(DATE_STRIP_DAYS / 2);
    const offset = selectedIndex * (DATE_CELL_WIDTH + DATE_GAP) + DATE_CELL_WIDTH / 2 - dateStripWidth / 2;
    dateStripRef.current?.scrollTo({ x: Math.max(0, offset), animated: false });
  }, [dateStripWidth, selectedDate]);

  /** EN: Selects one day, updates navigation state, and clears range selection. UK: Вибирає один день, оновлює стан навігації та очищає вибір діапазону. */
  const chooseDate = (date) => {
    const key = dateKey(date);
    setSelectedDate(key);
    navigation.setParams({ date: key === today ? undefined : key });
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setRange({ start: null, end: null });
  };

  /** EN: Extends or restarts the calendar range while keeping its endpoints ordered. UK: Розширює або починає заново календарний діапазон, зберігаючи правильний порядок меж. */
  const chooseRangeDate = (date) => {
    const key = dateKey(date);
    setSelectedDate(key);
    navigation.setParams({ date: key === today ? undefined : key });
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));

    setRange(/* EN: Converts the next click into a start point or an ordered completed range. UK: Перетворює наступне натискання на початок або впорядкований завершений діапазон. */ (current) => {
      if (!current.start || current.end) return { start: key, end: null };
      return key < current.start
        ? { start: key, end: current.start }
        : { start: current.start, end: key };
    });
  };

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const calendarStart = addDays(firstDay, -((firstDay.getDay() + 6) % 7));
  const calendarDays = Array.from({ length: 42 }, /* EN: Produces each cell in the six-week calendar grid. UK: Створює кожну клітинку шеститижневої календарної сітки. */ (_, index) => addDays(calendarStart, index));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>{t('trainingPlan').toUpperCase()}</Text>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{t('training')}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('openCalendar')} onPress={/* EN: Opens the calendar modal from the header action. UK: Відкриває календарне модальне вікно з дії заголовка. */ () => setCalendarOpen(true)} style={[styles.calendarButton, { borderColor: theme.border }]}>
            <Ionicons color={theme.textPrimary} name="calendar-outline" size={22} />
          </Pressable>
        </View>

        <Pressable onPress={/* EN: Opens the calendar when the selected-date label is pressed. UK: Відкриває календар після натискання на підпис вибраної дати. */ () => setCalendarOpen(true)}>
          <Text style={[styles.selectedDate, { color: theme.textPrimary }]}>{selected.toLocaleDateString(localeTag, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </Pressable>

        <ScrollView
          horizontal
          onLayout={/* EN: Stores the measured strip width for precise centering. UK: Зберігає виміряну ширину стрічки для точного центрування. */ (event) => setDateStripWidth(event.nativeEvent.layout.width)}
          ref={dateStripRef}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
        >
          {nearbyDates.map(/* EN: Renders each nearby date with selection and assignment indicators. UK: Відображає кожну сусідню дату з позначками вибору та призначень. */ (date) => {
            const key = dateKey(date);
            const active = key === selectedDate || isInRange(key);
            return (
              <Pressable key={key} onPress={/* EN: Selects this date-strip day. UK: Вибирає цей день у стрічці дат. */ () => chooseDate(date)} style={[styles.dateCell, { borderColor: theme.border }, active && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
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

        {loading ? <ActivityIndicator color={theme.primary} /> : selectedAssignments.map(/* EN: Renders one program card per filtered assignment. UK: Відображає окрему картку програми для кожного відфільтрованого призначення. */ (assignment) => (
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
            <Pressable onPress={/* EN: Opens Workshop so the user can choose a program for an empty day. UK: Відкриває Майстерню, щоб користувач міг вибрати програму для порожнього дня. */ () => navigation.getParent()?.navigate('Home')}><Text style={[styles.link, { color: theme.primary }]}>{t('openWorkshop')}</Text></Pressable>
          </View>
        )}
        {!!error && <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>}
      </ScrollView>

      <Modal visible={calendarOpen} transparent animationType="fade" onRequestClose={/* EN: Closes the calendar for the platform back action. UK: Закриває календар у відповідь на системну дію повернення. */ () => setCalendarOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.monthHeader}>
              <Pressable onPress={/* EN: Moves the calendar to the previous month. UK: Переміщує календар до попереднього місяця. */ () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Text style={[styles.monthArrow, { color: theme.textPrimary }]}>‹</Text></Pressable>
              <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>{month.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })}</Text>
              <Pressable onPress={/* EN: Moves the calendar to the next month. UK: Переміщує календар до наступного місяця. */ () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Text style={[styles.monthArrow, { color: theme.textPrimary }]}>›</Text></Pressable>
            </View>
            <Text style={[styles.rangeHint, { color: theme.textSecondary }]}>{t('scheduleRangeHint')}</Text>
            <View style={styles.weekHeader}>{weekDays[locale].map(/* EN: Renders localized weekday headings. UK: Відображає локалізовані заголовки днів тижня. */ (day) => <Text key={day} style={[styles.weekLabel, { color: theme.textSecondary }]}>{day}</Text>)}</View>
            <View style={styles.monthGrid}>{calendarDays.map(/* EN: Renders each calendar cell with range and schedule state. UK: Відображає кожну клітинку календаря зі станом діапазону та розкладу. */ (date) => {
              const key = dateKey(date);
              const {
                active,
                startsSelection: rangeStartDay,
                endsSelection: rangeEndDay,
              } = calendarDaySelection(key, selectedDate, rangeStart, rangeEnd);
              const inMonth = date.getMonth() === month.getMonth();
              return <Pressable key={key} onPress={/* EN: Adds this calendar day to the active range selection. UK: Додає цей календарний день до поточного вибору діапазону. */ () => chooseRangeDate(date)} style={styles.monthDay}>
                {active && <View style={[styles.rangeFill, { backgroundColor: theme.primary }, rangeStartDay && styles.rangeStart, rangeEndDay && styles.rangeEnd]} />}
                <Text style={[styles.monthDayText, { color: active ? palette.whitePure : inMonth ? theme.textPrimary : theme.textSecondary }]}>{date.getDate()}</Text>
                {assignedDates.has(key) && <View style={[styles.dot, { backgroundColor: active ? palette.whitePure : theme.secondary }]} />}
              </Pressable>;
            })}</View>
            <View style={styles.modalActions}>
              <Pressable onPress={/* EN: Selects today as the next range endpoint. UK: Вибирає сьогодні як наступну межу діапазону. */ () => chooseRangeDate(new Date())}><Text style={[styles.link, { color: theme.primary }]}>{t('today')}</Text></Pressable>
              <Pressable onPress={/* EN: Closes the calendar and keeps the current selection. UK: Закриває календар і зберігає поточний вибір. */ () => setCalendarOpen(false)}><Text style={[styles.link, { color: theme.textPrimary }]}>{t('close')}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
