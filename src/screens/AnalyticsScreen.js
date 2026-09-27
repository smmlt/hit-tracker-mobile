import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { analyticsService } from '../services/analyticsService';
import { bodyMetricsService } from '../services/bodyMetricsService';
import { useLibraryStore } from '../stores/libraryStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { exerciseName, isUpdatingStatistics, volumeDelta } from '../utils/analytics';
import { formatMetric, formatMetricDelta, periodToDateRange } from '../utils/bodyMetrics';
import { createStyles } from './AnalyticsScreen.styles';

export default function AnalyticsScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const { userToken } = useContext(AuthContext);
  const exercises = useLibraryStore((state) => state.exercises);
  const lastFinishedWorkoutId = useWorkoutStore((state) => state.lastFinishedWorkoutId);
  const { width } = useWindowDimensions();
  const requestId = useRef(0);
  const progressRequestId = useRef(0);
  const delay = useRef(null);
  const [summary, setSummary] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [progress, setProgress] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState(false);
  const [progressRevision, setProgressRevision] = useState(0);
  const [bodyMetrics, setBodyMetrics] = useState(null);
  const [bodyMetricsLoading, setBodyMetricsLoading] = useState(true);
  const [bodyMetricsError, setBodyMetricsError] = useState(false);

  useEffect(() => {
    setSummary(null);
    setWeeks([]);
    setRecords([]);
    setSelectedExerciseId(null);
    setBodyMetrics(null);
  }, [userToken]);

  const load = useCallback(async (pull = false) => {
    if (!userToken) return;
    const id = ++requestId.current;
    if (delay.current) { clearTimeout(delay.current.timer); delay.current.resolve(); delay.current = null; }
    if (pull) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const [nextSummary, nextWeeks, nextRecords] = await Promise.all([
          analyticsService.summary(userToken), analyticsService.weeklyVolume(userToken), analyticsService.personalRecords(userToken),
        ]);
        if (id !== requestId.current) return;
        setSummary(nextSummary);
        setWeeks(nextWeeks.weeks || []);
        setRecords(nextRecords.records || []);
        setProgressRevision((value) => value + 1);
        const pending = isUpdatingStatistics(lastFinishedWorkoutId, nextSummary);
        setUpdating(pending);
        if (!pending || attempt === 2) break;
        await new Promise((resolve) => { delay.current = { timer: setTimeout(resolve, 700 * (2 ** attempt)), resolve }; });
        delay.current = null;
        if (id !== requestId.current) return;
      }
    } catch (caught) {
      if (id === requestId.current) setError(caught);
    } finally {
      if (id === requestId.current) { setLoading(false); setRefreshing(false); }
    }
  }, [userToken, lastFinishedWorkoutId]);

  const loadBodyMetrics = useCallback(async () => {
    if (!userToken) return;
    const id = requestId.current;
    setBodyMetricsLoading(true);
    setBodyMetricsError(false);
    try {
      const data = await bodyMetricsService.get(userToken, periodToDateRange('7'));
      if (id === requestId.current) setBodyMetrics(data);
    } catch {
      if (id === requestId.current) setBodyMetricsError(true);
    } finally {
      if (id === requestId.current) setBodyMetricsLoading(false);
    }
  }, [userToken]);

  useFocusEffect(useCallback(() => {
    void load();
    void loadBodyMetrics();
    return () => {
      requestId.current += 1;
      progressRequestId.current += 1;
      if (delay.current) { clearTimeout(delay.current.timer); delay.current.resolve(); delay.current = null; }
    };
  }, [load, loadBodyMetrics]));

  useEffect(() => {
    if (!selectedExerciseId || !userToken) { setProgress([]); return undefined; }
    const id = ++progressRequestId.current;
    setProgressLoading(true);
    setProgressError(false);
    analyticsService.exerciseProgress(userToken, selectedExerciseId).then((data) => {
      if (id === progressRequestId.current) setProgress(data.points || []);
    }).catch(() => {
      if (id === progressRequestId.current) setProgressError(true);
    }).finally(() => {
      if (id === progressRequestId.current) setProgressLoading(false);
    });
    return () => { progressRequestId.current += 1; };
  }, [selectedExerciseId, userToken, progressRevision]);

  const refresh = () => { void load(true); void loadBodyMetrics(); };
  const number = (value) => Number(value || 0).toLocaleString(locale === 'uk' ? 'uk-UA' : 'en-US', { maximumFractionDigits: 1 });
  const date = (value) => value ? new Date(value).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US') : '—';
  const delta = summary ? volumeDelta(summary.thisWeek.volumeKg, summary.lastWeek.volumeKg) : null;
  const chartWidth = Math.max(270, width - 84);
  const weekBars = weeks.map((week, index) => ({ value: Number(week.volumeKg) || 0, label: index % 2 === 0 ? week.isoWeekStart.slice(5) : '', frontColor: theme.primary }));
  const selectedName = selectedExerciseId == null ? '' : exerciseName(exercises, selectedExerciseId, t('exerciseUnknown', { id: selectedExerciseId }));
  const chartSummary = t('analyticsWeeklyChartSummary', { weeks: weeks.length, volume: number(weeks.reduce((total, week) => total + Number(week.volumeKg || 0), 0)) });

  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <Text style={styles.title}>{t('analytics')}</Text>
      {loading && !summary ? <ActivityIndicator accessibilityLabel={t('loading')} color={theme.primary} /> : null}
      {error ? <View style={styles.card}>
        <Text style={styles.muted}>{error.status === 503 && error.details?.code === 'ANALYTICS_UNAVAILABLE' ? t('analyticsUnavailable') : t('analyticsLoadFailed')}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('retry')} style={styles.retry} onPress={() => load()}><Text style={styles.retryText}>{t('retry')}</Text></Pressable>
      </View> : null}
      {summary && !error ? <>
        {updating ? <Text style={styles.hint} accessibilityRole="status">{t('analyticsUpdating')}</Text> : null}
        {summary.lastWorkout ? <View style={styles.card}>
          <Text style={styles.heading}>{t('analyticsSummary')}</Text>
          <Text style={styles.large}>{number(summary.thisWeek.volumeKg)} {t('kgShort')}</Text>
          <Text style={styles.muted}>{t('analyticsThisWeek')} · {summary.thisWeek.workouts} {t('analyticsWorkouts')}</Text>
          <Text style={styles.muted}>{t('analyticsLastWeek')}: {number(summary.lastWeek.volumeKg)} {t('kgShort')} · {summary.lastWeek.workouts} {t('analyticsWorkouts')}</Text>
          <Text style={styles.muted}>{delta == null ? t('analyticsNoComparison') : `${delta > 0 ? '+' : ''}${delta}%`}</Text>
          <Text style={styles.muted}>{t('analyticsStreak', { current: summary.streak.currentDays, longest: summary.streak.longestDays })}</Text>
          <Text style={styles.muted}>{t('analyticsRecordCount', { count: summary.personalRecordCount })}</Text>
          <Text style={styles.muted}>{t('analyticsLastWorkout')}: {date(summary.lastWorkout.finishedAt)} · {number(summary.lastWorkout.volumeKg)} {t('kgShort')}</Text>
        </View> : updating ? null : <View style={styles.card}><Text style={styles.heading}>{t('analyticsEmpty')}</Text><Text style={styles.muted}>{t('analyticsEmptyHint')}</Text></View>}
        {summary.lastWorkout ? <><View style={styles.card} accessible accessibilityLabel={chartSummary}>
          <Text style={styles.heading}>{t('analyticsWeeklyVolume')}</Text>
          <Text style={styles.muted}>{chartSummary}</Text>
          {weekBars.some((bar) => bar.value > 0) ? <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart data={weekBars} width={chartWidth} barWidth={16} spacing={12} height={170} yAxisTextStyle={{ color: theme.textSecondary }} xAxisLabelTextStyle={{ color: theme.textSecondary }} yAxisColor={theme.border} xAxisColor={theme.border} noOfSections={4} />
          </ScrollView> : <Text style={styles.muted}>{t('analyticsNoWeeklyVolume')}</Text>}
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>{t('analyticsPersonalRecords')}</Text>
          {records.length ? records.map((record) => {
            const name = exerciseName(exercises, record.exerciseId, t('exerciseUnknown', { id: record.exerciseId }));
            return <Pressable key={record.exerciseId} accessibilityRole="button" accessibilityLabel={t('analyticsOpenProgress', { name })} style={styles.record} onPress={() => setSelectedExerciseId(record.exerciseId)}>
              <Text style={styles.recordName}>{name}</Text>
              <Text style={styles.muted}>{number(record.bestWeightKg)} {t('kgShort')} × {record.bestRepsAtWeight} · {date(record.achievedAt)}</Text>
            </Pressable>;
          }) : <Text style={styles.muted}>{t('analyticsNoRecords')}</Text>}
        </View>
        {selectedExerciseId != null ? <View style={styles.card}>
          <Text style={styles.heading}>{t('analyticsProgress', { name: selectedName })}</Text>
          {progressLoading ? <ActivityIndicator color={theme.primary} /> : progressError ? <Pressable accessibilityRole="button" accessibilityLabel={t('retry')} onPress={() => setProgressRevision((value) => value + 1)}><Text style={styles.retryText}>{t('analyticsLoadFailed')} {t('retry')}</Text></Pressable> : progress.length ? <>
            <Text style={styles.muted} accessibilityLabel={t('analyticsProgressChartSummary', { count: progress.length, weight: number(progress.at(-1).topSetWeightKg), e1rm: number(progress.at(-1).e1rmKg) })}>{t('analyticsTopSet')} · {t('analyticsE1rm')} · {progress.length} {t('analyticsSessions')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}><LineChart data={progress.map((point) => ({ value: Number(point.topSetWeightKg) || 0, label: point.date?.slice(5) }))} data2={progress.map((point) => ({ value: Number(point.e1rmKg) || 0 }))} width={Math.max(chartWidth, progress.length * 44)} height={180} color={theme.primary} color2={theme.textSecondary} yAxisTextStyle={{ color: theme.textSecondary }} xAxisLabelTextStyle={{ color: theme.textSecondary }} yAxisColor={theme.border} xAxisColor={theme.border} /></ScrollView>
          </> : <Text style={styles.muted}>{t('analyticsNoProgress')}</Text>}
        </View> : null}</> : null}
      </> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={t('bodyMetricsPreview')} onPress={() => navigation.navigate('BodyMetricsDetails', { period: '7' })} style={styles.card}>
        <Text style={styles.heading}>{t('bodyMetricsPreview')}</Text>
        {bodyMetricsLoading ? <Text style={styles.muted}>{t('loading')}</Text> : bodyMetricsError ? <Text style={styles.muted}>{t('bodyMetricsLoadFailed')}</Text> : <View style={styles.metricsGrid}>
          {[['weight', 'bodyMetricsWeight'], ['bodyFatPercentage', 'bodyMetricsFat'], ['muscleMass', 'bodyMetricsMuscle'], ['waistCircumference', 'bodyMetricsWaist']].map(([key, label]) => {
            const metric = bodyMetrics?.metrics?.[key];
            return <View key={key} style={styles.metric}><Text style={styles.muted}>{t(label)}</Text><Text style={styles.metricValue}>{metric?.latest ? formatMetric(metric.latest.value, key, locale, t) : '—'}</Text><Text style={styles.muted}>{metric?.change == null ? '—' : formatMetricDelta(metric.change, key, locale, t)}</Text></View>;
          })}
        </View>}
      </Pressable>
    </ScrollView>
  </SafeAreaView>;
}
