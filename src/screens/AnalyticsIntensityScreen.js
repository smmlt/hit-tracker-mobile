import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAnalyticsPeriod } from '../context/AnalyticsPeriodContext';
import AnalyticsPeriodPicker from '../components/analytics/AnalyticsPeriodPicker';
import { chartPointerConfig } from '../components/analytics/chartPointer';
import { analyticsService } from '../services/analyticsService';
import { periodToDateRange } from '../utils/bodyMetrics';
import { createStyles } from './AnalyticsIntensityScreen.styles';

export default function AnalyticsIntensityScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const { userToken } = useContext(AuthContext);
  const { period } = useAnalyticsPeriod();
  const { width } = useWindowDimensions();
  const range = useMemo(() => periodToDateRange(period), [period]);
  const requestId = useRef(0);
  const [data, setData] = useState(null);
  const [chartBoxWidth, setChartBoxWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const number = (value, digits = 0) => Number(value || 0).toLocaleString(localeTag, { maximumFractionDigits: digits });
  const chartBox = chartBoxWidth || Math.max(180, Math.min(width, 800) - 64);
  const chartWidth = Math.max(120, chartBox - 34);

  const load = useCallback(async () => {
    if (!userToken) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const response = await analyticsService.intensity(userToken, range);
      if (id === requestId.current) setData(response);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [range, userToken]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestId.current += 1; };
  }, [load]));

  const trend = data?.trend || [];
  const rpeTrend = trend.filter((point) => point.averageRpe != null);
  const volume = trend.filter((point) => Number(point.volumeKg) > 0);
  const showDateLabel = (index, length) => index === 0 || index === length - 1 || index % Math.max(1, Math.ceil((length - 1) / 4)) === 0;

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons color={theme.textPrimary} name="arrow-back" size={22} /></Pressable>
        <Text accessibilityRole="header" style={styles.title}>{t('analyticsTrainingLoad').toUpperCase()}</Text>
        <View style={styles.backButton} />
      </View>
      <AnalyticsPeriodPicker />
      {loading ? <ActivityIndicator color={theme.primary} size="large" style={styles.loader} /> : error ? <View style={styles.card}><Text style={styles.muted}>{t('analyticsLoadFailed')}</Text><Pressable accessibilityRole="button" onPress={load}><Text style={styles.retry}>{t('retry')}</Text></Pressable></View> : <>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('analyticsAverageRpe')}</Text>
          <Text style={styles.hero}>{data?.averageRpe == null ? '—' : number(data.averageRpe, 1)}</Text>
          <Text style={styles.muted}>{t('analyticsRpeScaleHint')}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('analyticsRpeTrend')}</Text>
          <View onLayout={(event) => setChartBoxWidth(Math.floor(event.nativeEvent.layout.width))} style={styles.chartBox}>{rpeTrend.length ? <LineChart adjustToWidth areaChart color={theme.primary} curved={rpeTrend.length > 2} data={rpeTrend.map((point, index) => ({ value: Number(point.averageRpe), label: showDateLabel(index, rpeTrend.length) ? point.date.slice(5) : '', pointerLabel: new Date(`${point.date}T12:00:00`).toLocaleDateString(localeTag, { day: 'numeric', month: 'short', year: 'numeric' }) }))} dataPointsColor={theme.textSecondary} disableScroll endFillColor={theme.cardBackground} endOpacity={0} endSpacing={0} height={165} hideDataPoints={rpeTrend.length > 1} initialSpacing={0} maxValue={10} noOfSections={5} pointerConfig={chartPointerConfig({ theme, formatValue: (value) => `RPE ${number(value, 1)}` })} rulesColor={theme.border} startFillColor={theme.primary} startOpacity={0.24} thickness={2} width={chartWidth} xAxisColor={theme.border} xAxisLabelTextStyle={styles.axisText} yAxisColor={theme.border} yAxisLabelWidth={34} yAxisTextStyle={styles.axisText} /> : <Text style={styles.muted}>{t('analyticsNoRpeDataPeriod')}</Text>}</View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('analyticsRpeDistribution')}</Text>
          {(data?.rpeDistribution || []).map((band) => <View key={band.range} style={styles.bandRow}><Text style={styles.bandLabel}>RPE {band.range}</Text><View style={styles.track}><View style={[styles.fill, { width: `${band.percentage}%` }]} /></View><Text style={styles.bandValue}>{number(band.percentage)}%</Text></View>)}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('analyticsSetsToFailure')}</Text>
          <Text style={styles.hero}>{data?.setsToFailure ?? 0} <Text style={styles.unit}>{t('analyticsOf')} {data?.totalSets ?? 0}</Text></Text>
          <Text style={styles.muted}>{data?.failurePercentage == null ? '—' : `${number(data.failurePercentage)}%`} {t('analyticsOfWorkingSets')}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('analyticsVolume')}</Text>
          <View style={styles.chartBox}>{volume.length ? <BarChart adjustToWidth barWidth={Math.max(3, Math.min(13, chartWidth / Math.max(1, volume.length) * 0.55))} data={volume.map((point, index) => ({ value: Number(point.volumeKg), label: showDateLabel(index, volume.length) ? point.date.slice(5) : '', pointerLabel: new Date(`${point.date}T12:00:00`).toLocaleDateString(localeTag, { day: 'numeric', month: 'short', year: 'numeric' }), frontColor: theme.primary }))} disableScroll endSpacing={0} height={145} initialSpacing={0} noOfSections={3} pointerConfig={chartPointerConfig({ theme, formatValue: (value) => `${number(value, 1)} ${t('kgShort')}` })} rulesColor={theme.border} width={chartWidth} xAxisColor={theme.border} xAxisLabelTextStyle={styles.axisText} yAxisColor={theme.border} yAxisLabelWidth={34} yAxisTextStyle={styles.axisText} /> : <Text style={styles.muted}>{t('analyticsNoWeeklyVolume')}</Text>}</View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('analyticsTrainingDensity')}</Text>
          <Text style={styles.hero}>{data?.volumePerMinute == null ? '—' : number(data.volumePerMinute, 1)} <Text style={styles.unit}>{t('kgShort')}/{t('minutesShort')}</Text></Text>
          <Text style={styles.muted}>{t('analyticsDensityHint')}</Text>
        </View>
      </>}
    </ScrollView>
  </SafeAreaView>;
}
