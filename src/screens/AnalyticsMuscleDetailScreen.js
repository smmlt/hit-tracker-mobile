/**
 * Shows detailed period analytics for one muscle group, deriving summary values from the analytics service and supporting back navigation. / Показує детальну аналітику однієї групи м’язів за період, обчислює підсумкові значення з аналітичного сервісу та підтримує повернення назад.
 */
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAnalyticsPeriod } from '../context/AnalyticsPeriodContext';
import AnalyticsPeriodPicker from '../components/analytics/AnalyticsPeriodPicker';
import { analyticsService } from '../services/analyticsService';
import { periodToDateRange } from '../utils/bodyMetrics';
import { createStyles } from './AnalyticsMuscleDetailScreen.styles';
import { translateCatalogName } from '../localization/catalog';

export default function AnalyticsMuscleDetailScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const { userToken } = useContext(AuthContext);
  const { period } = useAnalyticsPeriod();
  const range = useMemo(() => periodToDateRange(period), [period]);
  const requestId = useRef(0);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!userToken) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const data = await analyticsService.muscleGroups(userToken, range);
      if (id === requestId.current) setGroups(data.muscleGroups || []);
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

  const total = groups.reduce((sum, item) => sum + Number(item.workingSets || 0), 0);
  const totalPrimary = groups.reduce((sum, item) => sum + Number(item.primaryWorkingSets || 0), 0);
  const totalSecondary = groups.reduce((sum, item) => sum + Number(item.secondaryWorkingSets || 0), 0);
  const max = Math.max(1, ...groups.map((item) => Number(item.workingSets) || 0));
  const formatSets = (value) => Number(value || 0).toLocaleString(locale === 'uk' ? 'uk-UA' : 'en-US', { maximumFractionDigits: 1 });

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons color={theme.textPrimary} name="arrow-back" size={22} /></Pressable>
        <Text accessibilityRole="header" style={styles.title}>{t('analyticsMuscleBalance').toUpperCase()}</Text>
        <View style={styles.backButton} />
      </View>
      <AnalyticsPeriodPicker />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('analyticsMuscleWorkingSets')}</Text>
        <Text style={styles.hero}>{formatSets(total)} <Text style={styles.unit}>{t('setsShort')}</Text></Text>
        <View style={styles.totalsRow}>
          <Text style={styles.muted}>{t('analyticsPrimarySets')}: <Text style={styles.metricValue}>{formatSets(totalPrimary)}</Text></Text>
          <Text style={styles.muted}>{t('analyticsSecondarySets')}: <Text style={styles.metricValue}>{formatSets(totalSecondary)}</Text></Text>
        </View>
        {loading ? <ActivityIndicator color={theme.primary} style={styles.loader} /> : error ? <View><Text style={styles.muted}>{t('analyticsLoadFailed')}</Text><Pressable accessibilityRole="button" onPress={load}><Text style={styles.retry}>{t('retry')}</Text></Pressable></View> : groups.length ? groups.map((item) => <View key={item.muscleId} style={styles.groupRow}>
          <View style={styles.groupHeader}><Text numberOfLines={1} style={styles.groupName}>{translateCatalogName(t, 'muscle', item.name)}</Text><Text style={styles.groupValue}>{formatSets(item.workingSets)}</Text></View>
          <Text style={styles.groupMeta}>{t('analyticsPrimarySets')}: {formatSets(item.primaryWorkingSets)} · {t('analyticsSecondarySets')}: {formatSets(item.secondaryWorkingSets)}</Text>
          <View style={styles.track}><View style={[styles.fill, { width: `${Number(item.workingSets) / max * 100}%` }]} /></View>
        </View>) : <Text style={styles.muted}>{t('analyticsNoMuscleGroups')}</Text>}
      </View>
      <View style={styles.card}><View style={styles.insightRow}><Ionicons color={theme.secondary} name="information-circle-outline" size={22} /><Text style={styles.muted}>{t('analyticsMuscleFactHint')}</Text></View></View>
    </ScrollView>
  </SafeAreaView>;
}
