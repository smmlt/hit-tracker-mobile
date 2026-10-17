/**
 * Lists workout history with loading, refresh, and filter state, fetching records from the history service and opening workout details. / Показує історію тренувань зі станами завантаження, оновлення та фільтрів, отримує записи з сервісу історії й відкриває деталі тренування.
 */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { HistoryCard } from '../components/workout';
import { workoutsService } from '../services/workoutsService';
import {
  addDays,
  appendUniqueHistoryItems,
  chooseHistoryDate,
  dateKey,
  historyRequestFilters,
  isDateInSelection,
  parseDateKey,
  presetSelection,
  selectionQuery,
} from '../utils/history';
import { palette } from '../constants/colors';
import { createStyles } from './HistoryScreen.styles';
import { entityRef, isoDate } from '../utils/navigationPaths';

const weekDays = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
};
const EMPTY_SELECTION = { start: null, end: null };

/**
 * EN: Coordinates filtered, cursor-paginated workout history, calendar selection, refresh, and navigation to immutable workout details.
 * UK: Узгоджує відфільтровану історію тренувань із курсорною пагінацією, вибір у календарі, оновлення та перехід до незмінних деталей тренування.
 */
export default function HistoryScreen({ navigation, route }) {
  const { userToken } = useContext(AuthContext);
  const historyRevision = useWorkout(/* EN: Subscribes only to the revision counter that signals history-changing workout actions. / UK: Підписується лише на лічильник редакції, який сигналізує про дії, що змінюють історію тренувань. */ (state) => state.historyRevision);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const tabBarHeight = useBottomTabBarHeight();
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const listRef = useRef(null);
  const requestId = useRef(0);
  const loadMoreRunRef = useRef(null);
  const nextCursorRef = useRef(null);

  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [pageError, setPageError] = useState('');
  const initialSelection = route.params?.from
    ? { start: route.params.from, end: route.params.to || route.params.from }
    : EMPTY_SELECTION;
  const [query, setQuery] = useState(String(route.params?.q || ''));
  const [debouncedQuery, setDebouncedQuery] = useState(String(route.params?.q || ''));
  const [activePreset, setActivePreset] = useState(String(route.params?.preset || 'all'));
  const [selection, setSelection] = useState(initialSelection);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(EMPTY_SELECTION);
  const [month, setMonth] = useState(/* EN: Initializes the calendar at the first day of the current local month. / UK: Ініціалізує календар першим днем поточного місцевого місяця. */ () => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [workoutDates, setWorkoutDates] = useState(new Set());

  useEffect(/* EN: Debounces search text so typing does not issue a history request for every keystroke. / UK: Затримує пошуковий текст, щоб введення не створювало запит історії після кожного натискання клавіші. */ () => {
    const timeout = setTimeout(/* EN: Publishes the trimmed query after the user pauses typing. / UK: Застосовує очищений пошуковий запит після паузи у введенні. */ () => setDebouncedQuery(query.trim()), 350);
    return /* EN: Cancels the obsolete debounce when text changes or the screen unmounts. / UK: Скасовує застарілу затримку після зміни тексту або демонтажу екрана. */ () => clearTimeout(timeout);
  }, [query]);

  useEffect(/* EN: Mirrors active filters into route parameters so navigation preserves the visible history selection. / UK: Відображає активні фільтри в параметрах маршруту, щоб навігація зберігала видимий вибір історії. */ () => {
    navigation.setParams({
      from: selection.start || undefined,
      preset: activePreset === 'all' ? undefined : activePreset,
      q: debouncedQuery || undefined,
      to: selection.end || undefined,
    });
  }, [activePreset, debouncedQuery, navigation, selection.end, selection.start]);

  const singleDay = !!selection.start && selection.start === selection.end;
  const filters = useMemo(/* EN: Builds stable API filters only from the applied date selection and debounced query. / UK: Створює сталі фільтри API лише із застосованого вибору дат і затриманого пошукового запиту. */ () => historyRequestFilters(selection, debouncedQuery), [debouncedQuery, selection.end, selection.start]);

  /**
   * EN: Starts a new history generation, replaces the first page, and ignores responses superseded by newer filters or refreshes.
   * UK: Починає нове покоління історії, замінює першу сторінку та ігнорує відповіді, які замінили новіші фільтри або оновлення.
   */
  const loadFirstPage = useCallback(/* EN: Replaces history from the first page while guarding against stale responses. / UK: Замінює історію першою сторінкою із захистом від застарілих відповідей. */ async (keepItems = false) => {
    const id = ++requestId.current;
    loadMoreRunRef.current = null;
    if (keepItems) setRefreshing(true);
    else setLoading(true);
    setLoadingMore(false);
    setError('');
    setPageError('');
    try {
      const data = await workoutsService.getHistory(userToken, filters);
      if (id !== requestId.current) return;
      setItems(data.items || []);
      nextCursorRef.current = data.nextCursor || null;
      setNextCursor(nextCursorRef.current);
    } catch (loadError) {
      if (id === requestId.current) setError(loadError.message || t('historyLoadFailed'));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [filters, t, userToken]);

  useEffect(/* EN: Resets pagination, scroll position, and data whenever filters or the shared history revision require a fresh query. / UK: Скидає пагінацію, позицію прокручування та дані, коли фільтри або спільна редакція історії потребують нового запиту. */ () => {
    setItems([]);
    nextCursorRef.current = null;
    setNextCursor(null);
    listRef.current?.scrollToOffset({ animated: false, offset: 0 });
    loadFirstPage();
  }, [historyRevision, loadFirstPage]);

  /**
   * EN: Fetches one cursor page at a time, de-duplicates appended records, and keeps page errors separate from the initial load.
   * UK: Завантажує по одній курсорній сторінці, усуває дублікати доданих записів і відокремлює помилки сторінки від початкового завантаження.
   */
  const loadMore = useCallback(/* EN: Appends the next cursor page only when no equivalent request is running. / UK: Додає наступну курсорну сторінку лише за відсутності рівнозначного активного запиту. */ async () => {
    const cursor = nextCursorRef.current;
    if (!cursor || loading || loadMoreRunRef.current) return;
    const id = requestId.current;
    const run = { cursor, id };
    loadMoreRunRef.current = run;
    setLoadingMore(true);
    setPageError('');
    try {
      const data = await workoutsService.getHistory(userToken, { ...filters, cursor });
      if (id !== requestId.current) return;
      setItems(/* EN: Merges the page into the latest list without duplicating workouts. / UK: Об'єднує сторінку з найновішим списком без дублювання тренувань. */ (current) => appendUniqueHistoryItems(current, data.items || []));
      nextCursorRef.current = data.nextCursor || null;
      setNextCursor(nextCursorRef.current);
    } catch (loadError) {
      if (id === requestId.current) setPageError(loadError.message || t('loadMoreFailed'));
    } finally {
      if (loadMoreRunRef.current === run) {
        loadMoreRunRef.current = null;
        if (id === requestId.current) setLoadingMore(false);
      }
    }
  }, [filters, loading, t, userToken]);

  /**
   * EN: Starts prefetching the next page shortly before the user reaches the list bottom.
   * UK: Починає завчасне завантаження наступної сторінки незадовго до досягнення кінця списку.
   */
  const loadMoreOnScroll = useCallback(/* EN: Compares the current viewport edge with the pagination threshold. / UK: Порівнює край поточної видимої області з порогом пагінації. */ ({ nativeEvent }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 160) void loadMore();
  }, [loadMore]);

  /**
   * EN: Applies a date preset or toggles the already selected preset back to the unfiltered history.
   * UK: Застосовує готовий період або повторним вибором повертає вже активний період до невідфільтрованої історії.
   */
  const selectPreset = (preset) => {
    if (preset !== 'all' && activePreset === preset) {
      setActivePreset('all');
      setSelection(EMPTY_SELECTION);
      return;
    }
    setActivePreset(preset);
    setSelection(presetSelection(preset));
  };

  /**
   * EN: Opens a draft calendar selection at the month containing the current start date.
   * UK: Відкриває чернетку вибору в календарі на місяці, що містить поточну початкову дату.
   */
  const openCalendar = () => {
    const initial = selection.start ? parseDateKey(selection.start) : new Date();
    setMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
    setPendingSelection({ ...selection });
    setCalendarOpen(true);
  };

  useEffect(/* EN: Loads workout-marker dates for the visible calendar month and prevents an obsolete request from updating state. / UK: Завантажує дати-маркери тренувань для видимого місяця та не дає застарілому запиту оновити стан. */ () => {
    if (!calendarOpen) return undefined;
    let active = true;
    const from = new Date(month.getFullYear(), month.getMonth(), 1);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    workoutsService.getHistoryDates(userToken, from.toISOString(), to.toISOString())
      .then(/* EN: Applies returned workout dates only while this month request remains active. / UK: Застосовує повернені дати тренувань лише доки запит цього місяця залишається чинним. */ (dates) => {
        if (active) setWorkoutDates(new Set(dates.map(/* EN: Normalizes server timestamps to local calendar keys used by the grid. / UK: Нормалізує серверні часові позначки до локальних ключів дат, які використовує сітка. */ (value) => dateKey(new Date(value)))));
      })
      .catch(/* EN: Clears markers for a failed active month request without breaking date selection. / UK: Очищає маркери після невдалого чинного запиту місяця, не порушуючи вибір дат. */ () => {
        if (active) setWorkoutDates(new Set());
      });
    return /* EN: Marks the month request stale when the calendar context changes. / UK: Позначає запит місяця застарілим після зміни контексту календаря. */ () => { active = false; };
  }, [calendarOpen, month, userToken]);

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const calendarStart = addDays(firstDay, -((firstDay.getDay() + 6) % 7));
  const calendarDays = Array.from({ length: 42 }, /* EN: Produces the consecutive dates for a fixed six-week calendar grid. / UK: Створює послідовні дати для сталої шеститижневої сітки календаря. */ (_, index) => addDays(calendarStart, index));
  const today = new Date();
  const todayKey = dateKey(today);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canMoveNext = month < currentMonth;

  /**
   * EN: Commits the draft date selection as a custom filter, completing a single date into a one-day range.
   * UK: Застосовує чернетку вибору дат як власний фільтр, доповнюючи одну дату до одноденного діапазону.
   */
  const applyCalendar = () => {
    if (!pendingSelection.start) return;
    setSelection({
      start: pendingSelection.start,
      end: pendingSelection.end || pendingSelection.start,
    });
    setActivePreset('custom');
    setCalendarOpen(false);
  };

  /**
   * EN: Clears search and date filters together so the next request represents the complete history.
   * UK: Одночасно очищає пошуковий запит і фільтри дат, щоб наступний запит представляв повну історію.
   */
  const clearAll = () => {
    setQuery('');
    setDebouncedQuery('');
    setSelection(EMPTY_SELECTION);
    setActivePreset('all');
  };

  /**
   * EN: Chooses loading, retry, filtered-empty, or first-workout content according to the current request and filters.
   * UK: Вибирає вміст завантаження, повторної спроби, порожнього фільтра або першого тренування відповідно до поточного запиту й фільтрів.
   */
  const emptyContent = () => {
    if (loading) return <ActivityIndicator color={theme.primary} size="large" style={styles.loader} />;
    if (error) return (
      <View style={styles.empty}>
        <Ionicons color={theme.textSecondary} name="alert-circle-outline" size={38} />
        <Text style={styles.emptyTitle}>{t('historyLoadFailed')}</Text>
        <Pressable onPress={/* EN: Retries the failed initial-page request with the same filters. / UK: Повторює невдалий запит першої сторінки з тими самими фільтрами. */ () => loadFirstPage()} style={styles.emptyAction}>
          <Text style={styles.emptyActionText}>{t('tryAgain')}</Text>
        </Pressable>
      </View>
    );

    let title = t('noHistoryTitle');
    let hint = t('noHistoryHint');
    let action = t('startWorkout');
    /**
     * EN: Opens the active-workout flow when an entirely unfiltered history is empty.
     * UK: Відкриває процес активного тренування, коли повністю невідфільтрована історія порожня.
     */
    let onAction = () => navigation.getParent()?.navigate('ActiveWorkout');
    if (debouncedQuery) {
      title = t('noHistorySearch');
      hint = t('noHistorySearchHint');
      action = t('clearFilters');
      onAction = clearAll;
    } else if (selection.start) {
      title = singleDay ? t('noHistoryOnDay') : t('noHistoryInRange');
      hint = singleDay ? t('noHistoryOnDayHint') : t('noHistoryInRangeHint');
      action = t('showAllHistory');
      onAction = clearAll;
    }
    return (
      <View style={styles.empty}>
        <Ionicons color={theme.textSecondary} name="barbell-outline" size={42} />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyHint}>{hint}</Text>
        <Pressable onPress={onAction} style={styles.emptyAction}>
          <Text style={styles.emptyActionText}>{action}</Text>
        </Pressable>
      </View>
    );
  };

  /**
   * EN: Composes the search, preset, and custom-range controls that precede the virtualized history rows.
   * UK: Об'єднує елементи пошуку, готових періодів і власного діапазону перед віртуалізованими рядками історії.
   */
  const listHeader = (
    <View style={styles.headerContent}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>{t('workoutHistoryTitle').toUpperCase()}</Text>
        <Pressable accessibilityLabel={t('openCalendar')} onPress={openCalendar} style={styles.calendarButton}>
          <Ionicons color={activePreset === 'custom' ? theme.primary : theme.textPrimary} name="calendar-outline" size={24} />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons color={theme.inputPlaceholder} name="search" size={20} />
        <TextInput
          accessibilityLabel={t('historySearchPlaceholder')}
          onChangeText={setQuery}
          placeholder={t('historySearchPlaceholder')}
          placeholderTextColor={theme.inputPlaceholder}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
        {!!query && (
          <Pressable accessibilityLabel={t('clearSearch')} onPress={/* EN: Clears search text and lets the debounce trigger an unsearched reload. / UK: Очищає пошуковий текст і дає затримці запустити завантаження без пошуку. */ () => setQuery('')}>
            <Ionicons color={theme.inputPlaceholder} name="close-circle" size={20} />
          </Pressable>
        )}
      </View>

      <View style={styles.filters}>
        {[
          ['all', t('allDates')],
          ['today', t('today')],
          ['7', t('last7Days')],
          ['30', t('last30Days')],
        ].map(/* EN: Renders each date preset with active-state styling and toggle behavior. / UK: Відображає кожен готовий період зі стилем активного стану та поведінкою перемикача. */ ([preset, label]) => {
          const active = activePreset === preset;
          return (
            <Pressable
              key={preset}
              onPress={/* EN: Applies or toggles this preset through the shared selection handler. / UK: Застосовує або вимикає цей готовий період через спільний обробник вибору. */ () => selectPreset(preset)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {activePreset === 'custom' && selection.start && (
        <Pressable onPress={openCalendar} style={styles.appliedRange}>
          <Ionicons color={theme.primary} name="calendar-outline" size={16} />
          <Text style={styles.appliedRangeText}>
            {parseDateKey(selection.start).toLocaleDateString(localeTag, { day: 'numeric', month: 'short' })}
            {selection.end !== selection.start
              ? ` — ${parseDateKey(selection.end).toLocaleDateString(localeTag, { day: 'numeric', month: 'short', year: 'numeric' })}`
              : ''}
          </Text>
          <Ionicons color={theme.textSecondary} name="chevron-down" size={16} />
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <FlatList
        ref={listRef}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 28 }, !items.length && styles.emptyList]}
        data={items}
        initialNumToRender={15}
        keyExtractor={/* EN: Uses the persisted workout identifier as a stable list key. / UK: Використовує збережений ідентифікатор тренування як сталий ключ списку. */ (item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={emptyContent}
        ListFooterComponent={loadingMore ? (
          <ActivityIndicator color={theme.primary} style={styles.footerLoader} />
        ) : pageError ? (
          <Pressable accessibilityRole="button" onPress={loadMore} style={styles.retryPage}>
            <Text style={styles.retryPageText}>{t('loadMoreFailed')} · {t('tryAgain')}</Text>
          </Pressable>
        ) : nextCursor ? (
          <Pressable accessibilityLabel={t('showMore')} accessibilityRole="button" onPress={loadMore} style={styles.loadMoreButton}>
            <Text style={styles.loadMoreText}>{t('showMore')}</Text>
          </Pressable>
        ) : null}
        ListHeaderComponent={listHeader}
        maxToRenderPerBatch={15}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        onScroll={loadMoreOnScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={/* EN: Refreshes the first page while retaining current rows until the response arrives. / UK: Оновлює першу сторінку, зберігаючи поточні рядки до отримання відповіді. */ () => loadFirstPage(true)} tintColor={theme.primary} />}
        scrollEventThrottle={150}
        renderItem={/* EN: Renders each persisted workout as a history card with stable detail-route references. / UK: Відображає кожне збережене тренування як картку історії зі сталими посиланнями маршруту деталей. */ ({ item }) => (
          <HistoryCard workout={item} onPress={/* EN: Opens the selected workout snapshot using its date and readable entity reference. / UK: Відкриває вибраний знімок тренування за його датою та зрозумілим посиланням на сутність. */ () => navigation.navigate('HistoryDetails', {
            date: isoDate(item.finishedAt || item.createdAt),
            workoutRef: entityRef(item.programName || item.title || 'workout', item.id),
          })} />
        )}
        showsVerticalScrollIndicator={false}
      />

      <Modal animationType="fade" onRequestClose={/* EN: Closes the calendar for the platform back or dismiss action without applying its draft. / UK: Закриває календар після системної дії повернення або закриття без застосування чернетки. */ () => setCalendarOpen(false)} transparent visible={calendarOpen}>
        <View style={styles.overlay}>
          <View style={styles.calendarModal}>
            <Text style={styles.calendarTitle}>{t('selectDateOrPeriod')}</Text>
            <Text style={styles.calendarHint}>{t('calendarSelectionHint')}</Text>
            <View style={styles.monthHeader}>
              <Pressable onPress={/* EN: Moves the calendar to the first day of the previous month. / UK: Переміщує календар на перший день попереднього місяця. */ () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.monthArrow}>
                <Ionicons color={theme.textPrimary} name="chevron-back" size={22} />
              </Pressable>
              <Text style={styles.monthTitle}>{month.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })}</Text>
              <Pressable disabled={!canMoveNext} onPress={/* EN: Advances one month while the disabled guard prevents navigation beyond the current month. / UK: Переходить на один місяць уперед, а стан вимкнення не дозволяє перейти далі поточного місяця. */ () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={[styles.monthArrow, !canMoveNext && styles.disabled]}>
                <Ionicons color={theme.textPrimary} name="chevron-forward" size={22} />
              </Pressable>
            </View>
            <View style={styles.weekHeader}>
              {weekDays[locale].map(/* EN: Renders the Monday-first weekday labels for the active language. / UK: Відображає назви днів тижня від понеділка для поточної мови. */ (day) => <Text key={day} style={styles.weekLabel}>{day}</Text>)}
            </View>
            <View style={styles.monthGrid}>
              {calendarDays.map(/* EN: Builds each date cell with range, future-date, outside-month, and workout-marker states. / UK: Створює кожну клітинку дати зі станами діапазону, майбутньої дати, іншого місяця та маркера тренування. */ (date) => {
                const key = dateKey(date);
                const inMonth = date.getMonth() === month.getMonth();
                const future = key > todayKey;
                const disabled = !inMonth || future;
                const active = isDateInSelection(key, pendingSelection);
                const isStart = key === pendingSelection.start;
                const isEnd = key === (pendingSelection.end || pendingSelection.start);
                return (
                  <Pressable
                    accessibilityLabel={date.toLocaleDateString(localeTag)}
                    disabled={disabled}
                    key={key}
                    onPress={/* EN: Extends or restarts the draft range according to the selected date. / UK: Розширює або починає заново чернетку діапазону відповідно до вибраної дати. */ () => setPendingSelection(/* EN: Derives the next draft range from the latest selection to avoid stale presses. / UK: Обчислює наступну чернетку діапазону з найновішого вибору, щоб уникнути застарілих натискань. */ (current) => chooseHistoryDate(current, key))}
                    style={styles.monthDay}
                  >
                    {active && <View style={[styles.rangeFill, isStart && styles.rangeStart, isEnd && styles.rangeEnd]} />}
                    <Text style={[styles.monthDayText, !inMonth && styles.outsideMonth, future && styles.disabled, active && styles.activeDayText]}>{date.getDate()}</Text>
                    {workoutDates.has(key) && <View style={[styles.workoutDot, active && styles.activeDot]} />}
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.legend}>
              <View style={styles.workoutDot} />
              <Text style={styles.legendText}>{t('dayWithWorkout')}</Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={/* EN: Discards the calendar draft and closes the modal. / UK: Відкидає чернетку календаря та закриває модальне вікно. */ () => setCalendarOpen(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable disabled={!pendingSelection.start} onPress={applyCalendar} style={[styles.applyButton, !pendingSelection.start && styles.disabled]}>
                <Text style={styles.applyText}>{t('apply')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
