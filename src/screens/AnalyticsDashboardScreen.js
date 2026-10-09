import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAnalyticsPeriod } from '../context/AnalyticsPeriodContext';
import AnalyticsPeriodPicker from '../components/analytics/AnalyticsPeriodPicker';
import { analyticsService } from '../services/analyticsService';
import { bodyMetricsService } from '../services/bodyMetricsService';
import { formatMetric, formatMetricDelta, periodToDateRange } from '../utils/bodyMetrics';
import { translateCatalogName } from '../localization/catalog';
import { createStyles } from './AnalyticsDashboardScreen.styles';

const BODY_METRICS = [
  ['weight', 'bodyMetricsWeight'],
  ['waistCircumference', 'bodyMetricsWaist'],
  ['bodyFatPercentage', 'bodyMetricsFat'],
  ['muscleMass', 'bodyMetricsMuscle'],
];

export default function AnalyticsDashboardScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const { userToken } = useContext(AuthContext);
  const { period } = useAnalyticsPeriod();
  const { width } = useWindowDimensions();
  const requestId = useRef(0);
  const range = useMemo(() => periodToDateRange(period), [period]);
  const [data, setData] = useState({ overview: null, intensity: null, strength: [], body: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const number = (value, digits = 0) => Number(value || 0).toLocaleString(localeTag, { maximumFractionDigits: digits });

  const load = useCallback(async (refresh = false) => {
    if (!userToken) return;
    const id = ++requestId.current;
    refresh ? setRefreshing(true) : setLoading(true);
    setError(false);
    const results = await Promise.allSettled([
      analyticsService.overview(userToken, range),
      analyticsService.intensity(userToken, range),
      analyticsService.strength(userToken, range),
      bodyMetricsService.get(userToken, range),
    ]);
    if (id !== requestId.current) return;
    const [overview, intensity, strength, body] = results;
    setData({
      overview: overview.status === 'fulfilled' ? overview.value : null,
      intensity: intensity.status === 'fulfilled' ? intensity.value : null,
      strength: strength.status === 'fulfilled' ? strength.value.exercises || [] : [],
      body: body.status === 'fulfilled' ? body.value : null,
    });
    setError(overview.status === 'rejected');
    setLoading(false);
    setRefreshing(false);
  }, [range, userToken]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestId.current += 1; };
  }, [load]));

  const overview = data.overview || {};
  const summary = overview.summary || {};
  const plan = overview.plan || {};
  const activity = overview.activity || [];
  const muscles = overview.muscleGroups || [];
  const maxActivity = Math.max(1, ...activity.map((item) => Math.max(Number(item.plannedWorkouts) || 0, Number(item.completedWorkouts) || 0)));
  const maxMuscle = Math.max(1, ...muscles.map((item) => Number(item.workingSets) || 0));
  const trend = (overview.intensityTrend || []).filter((point) => point.averageRpe != null);
  const intensity = data.intensity || {};
  const bodyMetrics = data.body?.metrics || {};
  const intensityChartWidth = Math.max(112, Math.min(178, width * 0.4));
  const narrowBodyGrid = width < 480;

  if (loading && !data.overview) return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}><ActivityIndicator color={theme.primary} size="large" style={styles.pageLoader} /></SafeAreaView>;

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="header" style={styles.title}>{t('analytics').toUpperCase()}</Text>
      <AnalyticsPeriodPicker />
      {error ? <View style={styles.card}><Text style={styles.muted}>{t('analyticsUnavailable')}</Text><Pressable accessibilityRole="button" onPress={() => load()} style={styles.retry}><Text style={styles.retryText}>{t('retry')}</Text></Pressable></View> : null}

      <View style={styles.topRow}>
        <View style={[styles.card, styles.planCard]}>
          <Text style={styles.cardTitle}>{t('analyticsPlanCompletion')}</Text>
          <View style={styles.inline}><Text style={styles.hero}>{plan.completedAssignments ?? 0}</Text><Text style={styles.muted}> {t('analyticsOf')} {plan.scheduledAssignments ?? 0}</Text><Text style={styles.percent}>{plan.adherencePercent == null ? '—' : `${number(plan.adherencePercent)}%`}</Text></View>
          <Text style={styles.muted}>{t('analyticsStreakShort')}: <Text style={styles.accentText}>{plan.currentStreakDays ?? 0}</Text> {t('analyticsDaysShort')}</Text>
        </View>
        <View style={[styles.card, styles.activityCard]}>
          <Text style={styles.cardTitle}>{t('analyticsActivity')}</Text>
          <Text style={styles.micro}>{t('analyticsActivityHint')}</Text>
          <View accessibilityLabel={t('analyticsComplianceChart')} style={styles.activityChart}>
            {activity.slice(-7).map((item) => {
              const planned = Number(item.plannedWorkouts) || 0;
              const completed = Number(item.completedWorkouts) || 0;
              return <View key={item.date} style={styles.activityColumn}>
                <View style={[styles.activityPlanned, { height: Math.max(planned ? 10 : 2, planned / maxActivity * 52) }]}><View style={[styles.activityDone, { height: `${Math.min(100, planned ? completed / planned * 100 : completed ? 100 : 0)}%` }]} /></View>
                <Text style={styles.chartLabel}>{item.date.slice(8)}</Text>
              </View>;
            })}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('analyticsTrainingSummary')}</Text>
        <View style={styles.summaryRow}>
          {[
            ['analyticsCompletedWorkouts', summary.workouts ?? 0, ''],
            ['analyticsActiveTime', number(summary.activeMinutes, 0), t('minutesShort')],
            ['analyticsWorkingSets', summary.workingSets ?? 0, ''],
            ['analyticsVolume', number(summary.volumeKg, 0), t('kgShort')],
          ].map(([key, value, unit], index) => <View key={key} style={[styles.summaryItem, index > 0 && styles.summaryBorder]}><Text style={styles.summaryLabel}>{t(key)}</Text><Text numberOfLines={1} style={styles.summaryValue}>{value}{unit ? <Text style={styles.unit}> {unit}</Text> : null}</Text></View>)}
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('AnalyticsIntensity')} style={styles.card}>
        <View style={styles.cardHeader}><Text style={styles.cardTitle}>{t('analyticsIntensity')}</Text><Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /></View>
        <View style={styles.intensityRow}>
          <View><Text style={styles.hero}>{summary.averageRpe == null ? '—' : number(summary.averageRpe, 1)}</Text><Text style={styles.muted}>{t('analyticsAverageRpe')}</Text></View>
          {trend.length ? <LineChart areaChart color={theme.primary} data={trend.map((point) => ({ value: Number(point.averageRpe) }))} dataPointsColor={theme.textSecondary} endFillColor={theme.cardBackground} endOpacity={0} height={78} hideRules hideYAxisText initialSpacing={8} maxValue={10} noOfSections={2} startFillColor={theme.primary} startOpacity={0.3} thickness={2} width={intensityChartWidth} xAxisColor={theme.border} yAxisColor={theme.border} /> : <Text style={styles.muted}>{t('analyticsNoRpeDataPeriod')}</Text>}
        </View>
        <View style={styles.bandRow}>{(intensity.rpeDistribution || []).map((band) => <Text key={band.range} style={styles.band}>{band.range} <Text style={styles.bandValue}>{number(band.percentage)}%</Text></Text>)}</View>
        <Text style={styles.muted}>{t('analyticsFailureRate')}: {intensity.failurePercentage == null ? '—' : `${number(intensity.failurePercentage)}%`}</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('AnalyticsMuscleBalance')} style={styles.card}>
        <View style={styles.cardHeader}><View><Text style={styles.cardTitle}>{t('analyticsMuscleGroups')}</Text><Text style={styles.micro}>{t('analyticsWorkingSets')}</Text></View><Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /></View>
        {muscles.length ? muscles.map((item) => <View key={item.muscleId} style={styles.muscleRow}><Text numberOfLines={1} style={styles.muscleName}>{translateCatalogName(t, 'muscle', item.name)}</Text><View style={styles.muscleTrack}><View style={[styles.muscleFill, { width: `${Number(item.workingSets) / maxMuscle * 100}%` }]} /></View><Text style={styles.muscleCount}>{item.workingSets}</Text></View>) : <Text style={styles.muted}>{t('analyticsNoMuscleGroups')}</Text>}
      </Pressable>

      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('AnalyticsStrength')} style={styles.card}>
        <View style={styles.cardHeader}><Text style={styles.cardTitle}>{t('analyticsStrengthProgress')}</Text><Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /></View>
        {data.strength.length ? data.strength.slice(0, 5).map((exercise) => <View key={exercise.exerciseId} style={styles.strengthRow}><Text numberOfLines={1} style={styles.strengthName}>{exercise.name ? translateCatalogName(t, 'exercise', exercise.name) : t('exerciseUnknown', { id: exercise.exerciseId })}</Text><Text style={styles.delta}>{Number(exercise.changeKg) > 0 ? '+' : ''}{number(exercise.changeKg, 1)} {t('kgShort')}</Text></View>) : <Text style={styles.muted}>{t('analyticsNoProgress')}</Text>}
        {data.strength.length > 5 ? <Text style={styles.link}>{t('analyticsAllExercises')}</Text> : null}
      </Pressable>

      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('BodyMetricsDetails')} style={styles.card}>
        <View style={styles.cardHeader}><Text style={styles.cardTitle}>{t('bodyMetricsPreview')}</Text><Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /></View>
        <View style={[styles.bodyRow, narrowBodyGrid && styles.bodyRowNarrow]}>{BODY_METRICS.map(([key, label], index) => {
          const metric = bodyMetrics[key];
          return <View key={key} style={[styles.bodyItem, narrowBodyGrid && styles.bodyItemNarrow, (narrowBodyGrid ? index % 2 === 1 : index > 0) && styles.summaryBorder, narrowBodyGrid && index > 1 && styles.bodyItemLower]}><Text style={styles.summaryLabel}>{t(label)}</Text><Text style={styles.bodyValue}>{metric?.latest ? formatMetric(metric.latest.value, key, locale, t) : '—'}</Text><Text style={[styles.micro, Number(metric?.change) > 0 && styles.delta]}>{metric?.change == null ? '—' : formatMetricDelta(metric.change, key, locale, t)}</Text></View>;
        })}</View>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('analyticsInsights')}</Text>
        <View style={styles.insightRow}><Ionicons color={theme.secondary} name="bulb-outline" size={22} /><Text style={styles.insight}>{plan.adherencePercent == null ? t('analyticsInsightNoPlan') : t('analyticsInsightAdherence', { percent: number(plan.adherencePercent), completed: plan.completedAssignments, planned: plan.scheduledAssignments })}</Text></View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
