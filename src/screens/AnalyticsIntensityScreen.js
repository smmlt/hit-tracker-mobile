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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const number = (value, digits = 0) => Number(value || 0).toLocaleString(localeTag, { maximumFractionDigits: digits });
  const chartWidth = Math.max(180, Math.min(width, 800) - 74);

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
          {rpeTrend.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false}><LineChart color={theme.primary} data={rpeTrend.map((point) => ({ value: Number(point.averageRpe), label: point.date.slice(5) }))} dataPointsColor={theme.textSecondary} height={165} maxValue={10} noOfSections={5} rulesColor={theme.border} spacing={Math.max(44, chartWidth / Math.max(2, rpeTrend.length))} thickness={2} width={Math.max(chartWidth, rpeTrend.length * 48)} xAxisColor={theme.border} xAxisLabelTextStyle={styles.axisText} yAxisColor={theme.border} yAxisTextStyle={styles.axisText} /></ScrollView> : <Text style={styles.muted}>{t('analyticsNoRpeDataPeriod')}</Text>}
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
          {volume.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false}><BarChart barWidth={13} data={volume.map((point) => ({ value: Number(point.volumeKg), label: point.date.slice(5), frontColor: theme.primary }))} height={145} noOfSections={3} rulesColor={theme.border} spacing={18} width={Math.max(chartWidth, volume.length * 42)} xAxisColor={theme.border} xAxisLabelTextStyle={styles.axisText} yAxisColor={theme.border} yAxisTextStyle={styles.axisText} /></ScrollView> : <Text style={styles.muted}>{t('analyticsNoWeeklyVolume')}</Text>}
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
