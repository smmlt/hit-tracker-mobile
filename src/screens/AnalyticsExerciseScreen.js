import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BubbleChart, LineChart } from 'react-native-gifted-charts';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { analyticsService } from '../services/analyticsService';
import { periodToDateRange } from '../utils/bodyMetrics';
import { createStyles } from './AnalyticsExerciseScreen.styles';

export default function AnalyticsExerciseScreen({ navigation, route }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const { userToken } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const exerciseId = route.params?.exerciseId;
  const name = route.params?.name || t('exerciseUnknown', { id: exerciseId });
  const progressRequestId = useRef(0);
  const setsRequestId = useRef(0);
  const [progress, setProgress] = useState([]);
  const [sets, setSets] = useState([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [setsLoading, setSetsLoading] = useState(true);
  const [progressError, setProgressError] = useState(false);
  const [setsError, setSetsError] = useState(false);
  const range = useMemo(() => periodToDateRange('3m'), []);
  const chartWidth = Math.max(260, Math.min(width, 800) - 76);
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const number = (value) => Number(value || 0).toLocaleString(localeTag, { maximumFractionDigits: 1 });

  const loadProgress = useCallback(async () => {
    if (!userToken || exerciseId == null) return;
    const id = ++progressRequestId.current;
    setProgressLoading(true);
    setProgressError(false);
    try {
      const data = await analyticsService.exerciseProgress(userToken, exerciseId, range);
      if (id === progressRequestId.current) setProgress(data.points || []);
    } catch {
      if (id === progressRequestId.current) setProgressError(true);
    } finally {
      if (id === progressRequestId.current) setProgressLoading(false);
    }
  }, [exerciseId, range, userToken]);

  const loadSets = useCallback(async () => {
    if (!userToken || exerciseId == null) return;
    const id = ++setsRequestId.current;
    setSetsLoading(true);
    setSetsError(false);
    try {
      const data = await analyticsService.exerciseSets(userToken, exerciseId, range);
      const rows = Array.isArray(data) ? data : data.sets || data.points || [];
      if (id === setsRequestId.current) setSets(rows);
    } catch {
      if (id === setsRequestId.current) setSetsError(true);
    } finally {
      if (id === setsRequestId.current) setSetsLoading(false);
    }
  }, [exerciseId, range, userToken]);

  useFocusEffect(useCallback(() => {
    void loadProgress();
    void loadSets();
    return () => { progressRequestId.current += 1; setsRequestId.current += 1; };
  }, [loadProgress, loadSets]));

  const latest = progress.at(-1) || {};
  const scatter = sets.map((set) => ({
    x: Number(set.reps) || 0,
    y: Number(set.weightKg ?? set.weight) || 0,
    r: 6,
  })).filter((point) => point.x > 0 && point.y > 0);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons color={theme.textPrimary} name="arrow-back" size={22} /></Pressable>
          <Text numberOfLines={1} accessibilityRole="header" style={styles.title}>{name}</Text>
          <View style={styles.backButton} />
        </View>
        <Text style={styles.rangeLabel}>{t('analyticsLastThreeMonths')}</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{t('analyticsBestWeight')}</Text><Text style={styles.summaryValue}>{latest.topSetWeightKg == null ? '—' : `${number(latest.topSetWeightKg)} ${t('kgShort')}`}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{t('analyticsOneRepMax')}</Text><Text style={styles.summaryValue}>{latest.e1rmKg == null ? '—' : `${number(latest.e1rmKg)} ${t('kgShort')}`}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{t('analyticsSessions')}</Text><Text style={styles.summaryValue}>{progress.length}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{t('analyticsBestSet')}</Text><Text style={styles.summaryValue}>{latest.topSetReps ?? '—'} {t('repsShort')}</Text></View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('analyticsProgress', { name })}</Text>
          <Text style={styles.muted}>{t('analyticsTopSet')} · {t('analyticsE1rm')}</Text>
          {progressLoading ? <ActivityIndicator color={theme.primary} style={styles.loader} /> : progressError ? <View><Text style={styles.muted}>{t('analyticsLoadFailed')}</Text><Pressable accessibilityRole="button" onPress={loadProgress}><Text style={styles.retry}>{t('retry')}</Text></Pressable></View> : progress.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart data={progress.map((point) => ({ value: Number(point.topSetWeightKg) || 0, label: point.date?.slice(5) }))} data2={progress.map((point) => ({ value: Number(point.e1rmKg) || 0 }))} width={Math.max(chartWidth, progress.length * 44)} height={175} color={theme.primary} color2={theme.textSecondary} thickness={2} yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }} xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }} yAxisColor={theme.border} xAxisColor={theme.border} rulesColor={theme.border} />
            </ScrollView>
          ) : <Text style={styles.muted}>{t('analyticsNoProgress')}</Text>}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('analyticsStrengthByReps')}</Text>
          <Text style={styles.muted}>{t('analyticsReps')} · {t('analyticsWeight')}</Text>
          {setsLoading ? <ActivityIndicator color={theme.primary} style={styles.loader} /> : setsError ? <View><Text style={styles.muted}>{t('analyticsSetsUnavailable')}</Text><Pressable accessibilityRole="button" onPress={loadSets}><Text style={styles.retry}>{t('retry')}</Text></Pressable></View> : scatter.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BubbleChart data={scatter} scatterChart height={220} width={Math.max(chartWidth, 270)} endSpacing={18} xNoOfSections={5} yNoOfSections={4} xAxisColor={theme.border} yAxisColor={theme.border} rulesColor={theme.border} xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }} yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }} bubblesColor={theme.primary} />
            </ScrollView>
          ) : <Text style={styles.muted}>{t('analyticsNoSets')}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}