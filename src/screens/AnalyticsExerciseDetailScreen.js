import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BubbleChart, LineChart } from 'react-native-gifted-charts';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAnalyticsPeriod } from '../context/AnalyticsPeriodContext';
import AnalyticsPeriodPicker from '../components/analytics/AnalyticsPeriodPicker';
import { chartPointerConfig } from '../components/analytics/chartPointer';
import { analyticsService } from '../services/analyticsService';
import { periodToDateRange } from '../utils/bodyMetrics';
import { createStyles } from './AnalyticsExerciseDetailScreen.styles';
import { translateCatalogName } from '../localization/catalog';

const REP_RANGES = [[1, 3], [4, 6], [7, 9], [10, 12], [13, 15], [16, Infinity]];

export default function AnalyticsExerciseDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const { userToken } = useContext(AuthContext);
  const { period } = useAnalyticsPeriod();
  const { width } = useWindowDimensions();
  const exerciseId = route.params?.exerciseId;
  const name = route.params?.name
    ? translateCatalogName(t, 'exercise', route.params.name)
    : t('exerciseUnknown', { id: exerciseId });
  const range = useMemo(() => periodToDateRange(period), [period]);
  const requestId = useRef(0);
  const [progress, setProgress] = useState([]);
  const [sets, setSets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const number = (value) => Number(value || 0).toLocaleString(localeTag, { maximumFractionDigits: 1 });
  const chartWidth = Math.max(180, Math.min(width, 800) - 74);

  const load = useCallback(async () => {
    if (!userToken || !exerciseId) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const [progressData, setsData] = await Promise.all([
        analyticsService.exerciseProgress(userToken, exerciseId, range),
        analyticsService.exerciseSets(userToken, exerciseId, range),
      ]);
      if (id === requestId.current) {
        setProgress(progressData.points || []);
        setSets(setsData.sets || []);
      }
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [exerciseId, range, userToken]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestId.current += 1; };
  }, [load]));

  const best = sets.reduce((winner, set) => !winner || Number(set.weightKg) > Number(winner.weightKg) || (Number(set.weightKg) === Number(winner.weightKg) && Number(set.reps) > Number(winner.reps)) ? set : winner, null);
  const bestE1rm = Math.max(0, ...progress.map((point) => Number(point.e1rmKg) || 0));
  const byRange = REP_RANGES.map(([min, max]) => {
    const candidates = sets.filter((set) => Number(set.reps) >= min && Number(set.reps) <= max);
    const row = candidates.reduce((winner, set) => !winner || Number(set.weightKg) > Number(winner.weightKg) ? set : winner, null);
    return { label: max === Infinity ? `${min}+` : `${min}-${max}`, row };
  });
  const scatter = sets.filter((set) => Number(set.reps) > 0 && Number(set.weightKg) > 0).map((set) => ({ x: Number(set.reps), y: Number(set.weightKg), r: 5, onPress: () => setSelected(set) }));

  const openWorkout = () => {
    if (!selected?.workoutId) return;
    navigation.getParent()?.navigate('History', { screen: 'HistoryDetails', params: { workoutId: selected.workoutId } });
  };

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons color={theme.textPrimary} name="arrow-back" size={22} /></Pressable>
        <Text numberOfLines={1} accessibilityRole="header" style={styles.title}>{name.toUpperCase()}</Text>
        <View style={styles.backButton} />
      </View>
      <AnalyticsPeriodPicker />
      {loading ? <ActivityIndicator color={theme.primary} style={styles.loader} /> : error ? <View style={styles.card}><Text style={styles.muted}>{t('analyticsLoadFailed')}</Text><Pressable accessibilityRole="button" onPress={load}><Text style={styles.retry}>{t('retry')}</Text></Pressable></View> : <>
        <Text style={styles.sectionTitle}>{t('analyticsCurrentMetrics')}</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{t('analyticsBestSet')}</Text><Text style={styles.summaryValue}>{best ? `${number(best.weightKg)} ${t('kgShort')} × ${best.reps}` : '—'}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{t('analyticsBestWeight')}</Text><Text style={styles.summaryValue}>{best ? `${number(best.weightKg)} ${t('kgShort')}` : '—'}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{t('analyticsOneRepMax')}</Text><Text style={styles.summaryValue}>{bestE1rm ? `${number(bestE1rm)} ${t('kgShort')}` : '—'}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{t('analyticsWorkingSets')}</Text><Text style={styles.summaryValue}>{sets.length}</Text></View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('analyticsStrengthProgress')}</Text>
          {progress.length > 1 ? <LineChart adjustToWidth color={theme.primary} curved data={progress.map((point) => ({ value: Number(point.e1rmKg) || 0, label: point.date?.slice(5), pointerLabel: point.date ? new Date(`${point.date}T12:00:00`).toLocaleDateString(localeTag, { day: 'numeric', month: 'short', year: 'numeric' }) : '' }))} dataPointsColor={theme.textSecondary} disableScroll height={165} hideDataPoints pointerConfig={chartPointerConfig({ theme, formatValue: (value) => `${number(value)} ${t('kgShort')}` })} rulesColor={theme.border} thickness={2} width={chartWidth} xAxisColor={theme.border} xAxisLabelTextStyle={styles.axisText} yAxisColor={theme.border} yAxisTextStyle={styles.axisText} /> : <Text style={styles.muted}>{t(progress.length ? 'analyticsStrengthNeedsMoreData' : 'analyticsNoProgress')}</Text>}
        </View>
        <View style={styles.detailGrid}>
          <View style={[styles.card, styles.halfCard]}><Text style={styles.cardTitle}>{t('analyticsBestByRepRange')}</Text>{byRange.map(({ label, row }) => <View key={label} style={styles.rangeRow}><Text style={styles.muted}>{label}</Text><Text style={styles.detail}>{row ? `${number(row.weightKg)} ${t('kgShort')} × ${row.reps}` : '—'}</Text></View>)}</View>
          <View style={[styles.card, styles.halfCard]}><Text style={styles.cardTitle}>{t('analyticsStrengthByReps')}</Text>{scatter.length ? <BubbleChart bubblesColor={theme.textPrimary} data={scatter} endSpacing={10} height={190} rulesColor={theme.border} scatterChart width={Math.max(145, chartWidth / 2 - 24)} xAxisColor={theme.textPrimary} xAxisLabelTextStyle={styles.axisText} xNoOfSections={4} yAxisColor={theme.textPrimary} yAxisTextStyle={styles.axisText} yNoOfSections={4} /> : <Text style={styles.muted}>{t('analyticsNoSets')}</Text>}{selected ? <View style={styles.tooltip}><Text style={styles.tooltipText}>{number(selected.weightKg)} {t('kgShort')} × {selected.reps}</Text><Text style={styles.tooltipText}>{selected.date}</Text><Text style={styles.tooltipText}>RPE: {selected.rpe ?? '—'} · {t('analyticsFailure')}: {selected.isFailure ? t('yes') : t('no')}</Text><Text style={styles.tooltipText}>{t('analyticsSetNumber')}: {selected.setNumber ?? '—'}</Text></View> : null}</View>
        </View>
        {selected?.workoutId ? <Pressable accessibilityRole="button" onPress={openWorkout} style={styles.cta}><Text style={styles.ctaText}>{t('analyticsViewWorkout')}</Text></Pressable> : null}
      </>}
    </ScrollView>
  </SafeAreaView>;
}
