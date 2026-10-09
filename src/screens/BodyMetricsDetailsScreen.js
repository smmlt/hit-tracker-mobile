import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAnalyticsPeriod } from '../context/AnalyticsPeriodContext';
import AnalyticsPeriodPicker from '../components/analytics/AnalyticsPeriodPicker';
import { bodyMetricsService } from '../services/bodyMetricsService';
import {
  BODY_METRIC_KEYS,
  BODY_METRICS,
  chartLabelPositions,
  chartLayout,
  chartPoints,
  formatMetric,
  formatMetricDelta,
  measurementList,
  metricState,
  periodToDateRange,
} from '../utils/bodyMetrics';
import { createStyles } from './BodyMetricsDetailsScreen.styles';

const metricLabelKeys = {
  weight: 'bodyMetricsWeight',
  bodyFatPercentage: 'bodyMetricsFat',
  muscleMass: 'bodyMetricsMuscle',
  waistCircumference: 'bodyMetricsWaist',
};

const CHART_LABEL_WIDTH = 56;

const metricTitleKeys = {
  weight: 'bodyMetricsDynamicsWeight',
  bodyFatPercentage: 'bodyMetricsDynamicsFat',
  muscleMass: 'bodyMetricsDynamicsMuscle',
  waistCircumference: 'bodyMetricsDynamicsWaist',
};

export default function BodyMetricsDetailsScreen({ navigation, route }) {
  const { userToken } = useContext(AuthContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const styles = createStyles(theme);
  const { period } = useAnalyticsPeriod();
  const requestId = useRef(0);
  const [activeMetric, setActiveMetric] = useState('weight');
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartBoxWidth, setChartBoxWidth] = useState(0);

  const range = useMemo(() => periodToDateRange(period), [period]);

  const load = useCallback(async () => {
    if (!userToken) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const next = await bodyMetricsService.get(userToken, range);
      if (id !== requestId.current) return;
      setPayload(next);
    } catch (requestError) {
      if (id === requestId.current) setError(requestError);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [range, t, userToken]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  useEffect(() => {
    if (!route.params?.measurementSaved) return;
    navigation.setParams({ measurementSaved: undefined });
  }, [navigation, route.params?.measurementSaved]);

  const metric = payload?.metrics?.[activeMetric] || { points: [], latest: null, first: null, current: null, change: null };
  const state = metricState(metric);
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  // Measured card width; the window-based value only covers the first frame.
  const chartWidth = chartBoxWidth || Math.max(220, Math.min(width, 800) - 64);
  const selectedValue = metric.current?.value ?? metric.latest?.value;
  const list = measurementList(metric);
  const listWithOutside = list.length ? list : metric.latest ? [{ ...metric.latest, delta: null, outside: true }] : [];
  const points = chartPoints(metric, locale);
  const layout = points.length > 1 ? chartLayout(points, chartWidth) : null;
  const chartLabels = layout ? chartLabelPositions(points, layout, chartWidth, CHART_LABEL_WIDTH) : [];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 96 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons color={theme.textPrimary} name="arrow-back" size={24} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.headerTitle}>{t('bodyMetricsDetails')}</Text>
          <View style={styles.backButton} />
        </View>

        <AnalyticsPeriodPicker />

        <ScrollView contentContainerStyle={styles.metricTabsContent} horizontal showsHorizontalScrollIndicator={false} style={styles.metricTabs}>
          {BODY_METRIC_KEYS.map((key) => (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: key === activeMetric }} key={key} onPress={() => setActiveMetric(key)} style={({ focused, hovered, pressed }) => [styles.metricTab, key === activeMetric && styles.metricTabActive, (focused || hovered) && styles.interactive, pressed && styles.pressed]}>
              <Text numberOfLines={1} style={[styles.metricTabText, key === activeMetric && styles.metricTabTextActive]}>{t(metricLabelKeys[key])}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? <ActivityIndicator color={theme.primary} size="large" style={styles.loader} /> : error ? (
          <View style={styles.emptyState}>
            <Ionicons color={theme.textSecondary} name="alert-circle-outline" size={38} />
            <Text style={styles.emptyTitle}>{t('bodyMetricsLoadFailed')}</Text>
            <Pressable accessibilityRole="button" onPress={load} style={styles.retryButton}><Text style={styles.retryText}>{t('retry')}</Text></Pressable>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t(metricTitleKeys[activeMetric])}</Text>
              {selectedValue === undefined || selectedValue === null ? (
                <View style={styles.cardEmpty}>
                  <Text style={styles.emptyTitle}>{t('bodyMetricsNever')}</Text>
                  <Text style={styles.emptyHint}>{t('bodyMetricsNoDataHint')}</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.currentValue}>{formatMetric(selectedValue, activeMetric, locale, t)}</Text>
                  {state.status === 'chart' ? (
                    <>
                      <Text style={styles.metaText}>{t('bodyMetricsChange', { value: formatMetricDelta(metric.change, activeMetric, locale, t) })}</Text>
                      <Text style={styles.metaText}>{t('bodyMetricsAtStart', { value: formatMetric(metric.first?.value, activeMetric, locale, t) })}</Text>
                      <View onLayout={(event) => setChartBoxWidth(Math.floor(event.nativeEvent.layout.width))} style={styles.chartBox}>
                      <LineChart
                        areaChart
                        data={points.map(({ value }) => ({ value }))}
                        endFillColor={theme.bodyMetricsChartFill}
                        endOpacity={0.02}
                        height={150}
                        hideRules
                        endSpacing={layout.endSpacing}
                        hideYAxisText
                        initialSpacing={layout.initialSpacing}
                        maxValue={layout.maxValue}
                        noOfSections={3}
                        startFillColor={theme.bodyMetricsChartFill}
                        startOpacity={0.24}
                        thickness={2}
                        spacing={layout.spacing}
                        width={chartWidth}
                        yAxisLabelWidth={0}
                        yAxisOffset={layout.yAxisOffset}
                        xAxisColor={theme.bodyMetricsChartAxis}
                        xAxisThickness={0}
                        xAxisLabelsHeight={0}
                        yAxisColor={theme.bodyMetricsChartAxis}
                        color={theme.bodyMetricsChartLine}
                        dataPointsColor={theme.textSecondary}
                      />
                      <View style={[styles.chartLabels, { width: chartWidth }]}>
                        {chartLabels.map(({ index, left, label }) => (
                          <Text key={points[index].recordedAt} numberOfLines={1} style={[styles.chartLabel, styles.chartLabelItem, { left, width: CHART_LABEL_WIDTH }]}>{label}</Text>
                        ))}
                      </View>
                      </View>
                    </>
                  ) : state.status === 'single' ? (
                    <Text style={styles.metaText}>{t('bodyMetricsNeedTwo')}</Text>
                  ) : (
                    <Text style={styles.metaText}>{t('bodyMetricsLatestOutside')}</Text>
                  )}
                  {state.status === 'empty' && <Text style={styles.metaText}>{t('bodyMetricsNoData')}</Text>}
                </>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('bodyMetricsLatest')}</Text>
              {listWithOutside.length ? listWithOutside.map((item, index) => (
                <View key={`${item.recordedAt}-${index}`} style={styles.measurementRow}>
                  <Text style={styles.dateText}>{item.outside ? t('bodyMetricsLatestOutside') : new Date(item.recordedAt).toLocaleDateString(localeTag, { day: 'numeric', month: 'short' })}</Text>
                  <Text style={styles.measurementValue}>{formatMetric(item.value, activeMetric, locale, t)}</Text>
                  <Text style={styles.deltaText}>{item.delta === null ? '—' : formatMetricDelta(item.delta, activeMetric, locale, t)}</Text>
                </View>
              )) : <Text style={styles.metaText}>{t('bodyMetricsNoData')}</Text>}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.ctaDock}>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('AddBodyMeasurement', { returnRoute: 'BodyMetricsDetails' })} style={({ focused, hovered, pressed }) => [styles.ctaButton, (focused || hovered) && styles.interactive, pressed && styles.pressed]}>
          <Text style={styles.ctaText}>{t('addMeasurement')}</Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}
