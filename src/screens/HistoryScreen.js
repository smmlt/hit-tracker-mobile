import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { WorkoutContext } from '../context/WorkoutContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { HistoryCard } from '../components/workout';
import { workoutsService } from '../services/workoutsService';
import {
  addDays,
  chooseHistoryDate,
  dateKey,
  isDateInSelection,
  parseDateKey,
  presetSelection,
  selectionQuery,
} from '../utils/history';
import { palette } from '../constants/colors';
import { createStyles } from './HistoryScreen.styles';

const weekDays = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
};
const EMPTY_SELECTION = { start: null, end: null };

export default function HistoryScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const { historyRevision } = useContext(WorkoutContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const tabBarHeight = useBottomTabBarHeight();
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const listRef = useRef(null);
  const requestId = useRef(0);

  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [pageError, setPageError] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activePreset, setActivePreset] = useState('all');
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(EMPTY_SELECTION);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [workoutDates, setWorkoutDates] = useState(new Set());

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timeout);
  }, [query]);

  const singleDay = !!selection.start && selection.start === selection.end;
  const filters = useMemo(() => ({
    ...selectionQuery(selection),
    ...(debouncedQuery ? { q: debouncedQuery } : {}),
    ...(!singleDay ? { limit: 15 } : {}),
  }), [debouncedQuery, selection.end, selection.start, singleDay]);

  const loadFirstPage = useCallback(async (keepItems = false) => {
    const id = ++requestId.current;
    if (keepItems) setRefreshing(true);
    else setLoading(true);
    setLoadingMore(false);
    setError('');
    setPageError('');
    try {
      const data = await workoutsService.getHistory(userToken, filters);
      if (id !== requestId.current) return;
      setItems(data.items || []);
      setNextCursor(data.nextCursor || null);
    } catch (loadError) {
      if (id === requestId.current) setError(loadError.message || t('historyLoadFailed'));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [filters, t, userToken]);

  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    listRef.current?.scrollToOffset({ animated: false, offset: 0 });
    loadFirstPage();
  }, [historyRevision, loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading || loadingMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    setPageError('');
    try {
      const data = await workoutsService.getHistory(userToken, { ...filters, cursor: nextCursor });
      if (id !== requestId.current) return;
      setItems((current) => [...current, ...(data.items || [])]);
      setNextCursor(data.nextCursor || null);
    } catch (loadError) {
      if (id === requestId.current) setPageError(loadError.message || t('loadMoreFailed'));
    } finally {
      if (id === requestId.current) setLoadingMore(false);
    }
  }, [filters, loading, loadingMore, nextCursor, t, userToken]);

  const selectPreset = (preset) => {
    if (preset !== 'all' && activePreset === preset) {
      setActivePreset('all');
      setSelection(EMPTY_SELECTION);
      return;
    }
    setActivePreset(preset);
    setSelection(presetSelection(preset));
  };

  const openCalendar = () => {
    const initial = selection.start ? parseDateKey(selection.start) : new Date();
    setMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
    setPendingSelection({ ...selection });
    setCalendarOpen(true);
  };

  useEffect(() => {
    if (!calendarOpen) return undefined;
    let active = true;
    const from = new Date(month.getFullYear(), month.getMonth(), 1);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    workoutsService.getHistoryDates(userToken, from.toISOString(), to.toISOString())
      .then((dates) => {
        if (active) setWorkoutDates(new Set(dates.map((value) => dateKey(new Date(value)))));
      })
      .catch(() => {
        if (active) setWorkoutDates(new Set());
      });
    return () => { active = false; };
  }, [calendarOpen, month, userToken]);

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const calendarStart = addDays(firstDay, -((firstDay.getDay() + 6) % 7));
  const calendarDays = Array.from({ length: 42 }, (_, index) => addDays(calendarStart, index));
  const today = new Date();
  const todayKey = dateKey(today);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canMoveNext = month < currentMonth;

  const applyCalendar = () => {
    if (!pendingSelection.start) return;
    setSelection({
      start: pendingSelection.start,
      end: pendingSelection.end || pendingSelection.start,
    });
    setActivePreset('custom');
    setCalendarOpen(false);
  };

  const clearAll = () => {
    setQuery('');
    setDebouncedQuery('');
    setSelection(EMPTY_SELECTION);
    setActivePreset('all');
  };

  const emptyContent = () => {
    if (loading) return <ActivityIndicator color={theme.primary} size="large" style={styles.loader} />;
    if (error) return (
      <View style={styles.empty}>
        <Ionicons color={theme.textSecondary} name="alert-circle-outline" size={38} />
        <Text style={styles.emptyTitle}>{t('historyLoadFailed')}</Text>
        <Pressable onPress={() => loadFirstPage()} style={styles.emptyAction}>
          <Text style={styles.emptyActionText}>{t('tryAgain')}</Text>
        </Pressable>
      </View>
    );

    let title = t('noHistoryTitle');
    let hint = t('noHistoryHint');
    let action = t('startWorkout');
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

  const listHeader = (
    <View style={styles.headerContent}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>{t('completedWorkouts').toUpperCase()}</Text>
          <Text style={styles.heading}>{t('workoutHistoryTitle')}</Text>
        </View>
        <Pressable accessibilityLabel={t('openCalendar')} onPress={openCalendar} style={styles.calendarButton}>
          <Ionicons color={activePreset === 'custom' ? theme.primary : theme.textPrimary} name="calendar-outline" size={22} />
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
          <Pressable accessibilityLabel={t('clearSearch')} onPress={() => setQuery('')}>
            <Ionicons color={theme.inputPlaceholder} name="close-circle" size={20} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {[
          ['all', t('allDates')],
          ['today', t('today')],
          ['7', t('last7Days')],
          ['30', t('last30Days')],
        ].map(([preset, label]) => {
          const active = activePreset === preset;
          return (
            <Pressable
              key={preset}
              onPress={() => selectPreset(preset)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={emptyContent}
        ListFooterComponent={loadingMore ? (
          <ActivityIndicator color={theme.primary} style={styles.footerLoader} />
        ) : pageError ? (
          <Pressable onPress={loadMore} style={styles.retryPage}>
            <Text style={styles.retryPageText}>{t('loadMoreFailed')} · {t('tryAgain')}</Text>
          </Pressable>
        ) : null}
        ListHeaderComponent={listHeader}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFirstPage(true)} tintColor={theme.primary} />}
        renderItem={({ item }) => (
          <HistoryCard workout={item} onPress={() => navigation.navigate('HistoryDetails', { workoutId: item.id })} />
        )}
        showsVerticalScrollIndicator={false}
      />

      <Modal animationType="fade" onRequestClose={() => setCalendarOpen(false)} transparent visible={calendarOpen}>
        <View style={styles.overlay}>
          <View style={styles.calendarModal}>
            <Text style={styles.calendarTitle}>{t('selectDateOrPeriod')}</Text>
            <Text style={styles.calendarHint}>{t('calendarSelectionHint')}</Text>
            <View style={styles.monthHeader}>
              <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.monthArrow}>
                <Ionicons color={theme.textPrimary} name="chevron-back" size={22} />
              </Pressable>
              <Text style={styles.monthTitle}>{month.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })}</Text>
              <Pressable disabled={!canMoveNext} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={[styles.monthArrow, !canMoveNext && styles.disabled]}>
                <Ionicons color={theme.textPrimary} name="chevron-forward" size={22} />
              </Pressable>
            </View>
            <View style={styles.weekHeader}>
              {weekDays[locale].map((day) => <Text key={day} style={styles.weekLabel}>{day}</Text>)}
            </View>
            <View style={styles.monthGrid}>
              {calendarDays.map((date) => {
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
                    onPress={() => setPendingSelection((current) => chooseHistoryDate(current, key))}
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
              <Pressable onPress={() => setCalendarOpen(false)} style={styles.cancelButton}>
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
