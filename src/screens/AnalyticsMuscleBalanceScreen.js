import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { analyticsService } from '../services/analyticsService';
import { formatRangeLabel, periodToDateRange } from '../utils/bodyMetrics';
import { createStyles } from './AnalyticsMuscleBalanceScreen.styles';

const PERIODS = [['7', 'bodyMetricsPeriod7'], ['14', 'bodyMetricsPeriod14'], ['1m', 'bodyMetricsPeriod1m'], ['3m', 'bodyMetricsPeriod3m']];
const METRICS = [['workingSets', 'analyticsWorkingSets'], ['volume', 'analyticsVolume']];

export default function AnalyticsMuscleBalanceScreen({ navigation, route }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const { userToken } = useContext(AuthContext);
  const requestId = useRef(0);
  const [period, setPeriod] = useState(route.params?.period === 'today' ? '7' : route.params?.period || '7');
  const [metric, setMetric] = useState('workingSets');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const range = useMemo(() => periodToDateRange(period), [period]);

  const load = useCallback(async () => {
    if (!userToken) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const data = await analyticsService.muscleGroups(userToken, range, metric);
      if (id === requestId.current) setGroups(data.muscleGroups || data.groups || []);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [metric, range, userToken]);

  useEffect(() => {
    void load();
    return () => { requestId.current += 1; };
  }, [load]);

  const valueFor = (item) => Number(metric === 'volume' ? item.volumeKg : item.workingSets) || 0;
  const total = groups.reduce((sum, item) => sum + valueFor(item), 0);
  const max = Math.max(1, ...groups.map(valueFor));
  const formatValue = (value) => metric === 'volume' ? `${Number(value).toLocaleString(locale === 'uk' ? 'uk-UA' : 'en-US', { maximumFractionDigits: 0 })} ${t('kgShort')}` : `${value} ${t('setsShort')}`;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons color={theme.textPrimary} name="arrow-back" size={22} /></Pressable>
          <Text accessibilityRole="header" style={styles.title}>{t('analyticsMuscleBalance')}</Text>
          <View style={styles.backButton} />
        </View>
        <ScrollView contentContainerStyle={styles.periodRow} horizontal showsHorizontalScrollIndicator={false}>
          {PERIODS.map(([value, key]) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: period === value }} key={value} onPress={() => setPeriod(value)} style={[styles.periodChip, period === value && styles.periodChipActive]}><Text style={[styles.periodText, period === value && styles.periodTextActive]}>{t(key)}</Text></Pressable>)}
        </ScrollView>
        <Text style={styles.rangeLabel}>{formatRangeLabel(range, locale)}</Text>
        <View style={styles.metricTabs}>
          {METRICS.map(([value, key]) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: metric === value }} key={value} onPress={() => setMetric(value)} style={[styles.metricTab, metric === value && styles.metricTabActive]}><Text style={[styles.metricTabText, metric === value && styles.metricTabTextActive]}>{t(key)}</Text></Pressable>)}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{metric === 'volume' ? t('analyticsMuscleVolume') : t('analyticsMuscleWorkingSets')}</Text>
          <Text style={styles.total}>{formatValue(total)}</Text>
          {loading ? <ActivityIndicator color={theme.primary} style={styles.loader} /> : error ? <View><Text style={styles.muted}>{t('analyticsLoadFailed')}</Text><Pressable accessibilityRole="button" onPress={load}><Text style={styles.retry}>{t('retry')}</Text></Pressable></View> : groups.length ? groups.map((item) => {
            const value = valueFor(item);
            return <View key={item.muscleId ?? item.name} style={styles.groupRow}>
              <View style={styles.groupLabel}><Text numberOfLines={1} style={styles.groupName}>{item.name}</Text><Text style={styles.groupValue}>{item.percentage == null ? `${total ? Math.round(value / total * 100) : 0}%` : `${Math.round(Number(item.percentage))}%`}</Text></View>
              <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(value > 0 ? 2 : 0, value / max * 100)}%` }]} /></View>
              <Text style={styles.muted}>{formatValue(value)}</Text>
            </View>;
          }) : <Text style={styles.muted}>{t('analyticsNoMuscleGroups')}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}