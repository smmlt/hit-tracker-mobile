import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
import { createStyles } from './AnalyticsStrengthListScreen.styles';
import { translateCatalogName } from '../localization/catalog';

export default function AnalyticsStrengthListScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const { userToken } = useContext(AuthContext);
  const { period } = useAnalyticsPeriod();
  const range = useMemo(() => periodToDateRange(period), [period]);
  const requestId = useRef(0);
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const number = (value) => Number(value || 0).toLocaleString(locale === 'uk' ? 'uk-UA' : 'en-US', { maximumFractionDigits: 1 });

  const load = useCallback(async () => {
    if (!userToken) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const data = await analyticsService.strength(userToken, range);
      if (id === requestId.current) setRecords(data.exercises || []);
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

  const filtered = records.filter((record) => (record.name || '').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons color={theme.textPrimary} name="arrow-back" size={22} /></Pressable>
        <Text accessibilityRole="header" style={styles.title}>{t('analyticsStrengthProgress').toUpperCase()}</Text>
        <View style={styles.backButton} />
      </View>
      <AnalyticsPeriodPicker />
      <View style={styles.search}><Ionicons color={theme.textSecondary} name="search-outline" size={22} /><TextInput accessibilityLabel={t('analyticsSearchExercises')} onChangeText={setQuery} placeholder={t('analyticsSearchExercises')} placeholderTextColor={theme.textSecondary} style={styles.searchInput} value={query} /></View>
      {loading ? <ActivityIndicator color={theme.primary} style={styles.loader} /> : error ? <View style={styles.card}><Text style={styles.muted}>{t('analyticsLoadFailed')}</Text><Pressable accessibilityRole="button" onPress={load}><Text style={styles.retry}>{t('retry')}</Text></Pressable></View> : filtered.length ? filtered.map((record) => {
        const name = record.name
          ? translateCatalogName(t, 'exercise', record.name)
          : t('exerciseUnknown', { id: record.exerciseId });
        return <Pressable accessibilityLabel={t('analyticsOpenProgress', { name })} accessibilityRole="button" key={record.exerciseId} onPress={() => navigation.navigate('AnalyticsExercise', { exerciseId: record.exerciseId, name })} style={styles.card}>
          <View style={styles.cardHeader}><Text numberOfLines={1} style={styles.recordName}>{name}</Text><Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /></View>
          <Text style={styles.detail}>{t('analyticsLastSet')}: {number(record.lastSetWeightKg)} {t('kgShort')} × {record.lastSetReps}</Text>
          <Text style={styles.detail}>{t('analyticsBest')}: {number(record.bestWeightKg)} {t('kgShort')} × {record.bestRepsAtWeight}</Text>
          <View style={styles.cardHeader}><Text style={styles.detail}>{t('analyticsOneRepMax')}: {number(record.bestE1rmKg)} {t('kgShort')}</Text><Text style={styles.delta}>{Number(record.changeKg) > 0 ? '+' : ''}{number(record.changeKg)} {t('kgShort')}</Text></View>
        </Pressable>;
      }) : <View style={styles.card}><Text style={styles.muted}>{t('analyticsNoRecords')}</Text></View>}
    </ScrollView>
  </SafeAreaView>;
}
