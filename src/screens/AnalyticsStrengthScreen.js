import React, { useCallback, useContext, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useLibraryStore } from '../stores/libraryStore';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { analyticsService } from '../services/analyticsService';
import { exerciseName } from '../utils/analytics';
import { createStyles } from './AnalyticsStrengthScreen.styles';

export default function AnalyticsStrengthScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { t } = useContext(LanguageContext);
  const { userToken } = useContext(AuthContext);
  const exercises = useLibraryStore((state) => state.exercises);
  const requestId = useRef(0);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!userToken) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const data = await analyticsService.personalRecords(userToken);
      if (id === requestId.current) setRecords(data.records || []);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [userToken]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestId.current += 1; };
  }, [load]));

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons color={theme.textPrimary} name="arrow-back" size={22} /></Pressable>
          <Text accessibilityRole="header" style={styles.title}>{t('analyticsStrengthProgress')}</Text>
          <View style={styles.backButton} />
        </View>
        <Text style={styles.subtitle}>{t('analyticsPersonalRecords')}</Text>
        {loading ? <ActivityIndicator color={theme.primary} style={styles.loader} /> : error ? (
          <View style={styles.card}><Text style={styles.muted}>{t('analyticsLoadFailed')}</Text><Pressable accessibilityRole="button" onPress={load}><Text style={styles.retry}>{t('retry')}</Text></Pressable></View>
        ) : records.length ? records.map((record) => {
          const name = exerciseName(t, exercises, record.exerciseId, t('exerciseUnknown', { id: record.exerciseId }));
          const weight = Number(record.bestWeightKg) || 0;
          const reps = Number(record.bestRepsAtWeight) || 0;
          const lastWeight = record.lastSetWeightKg ?? record.lastWeightKg;
          const delta = record.changeKg ?? record.weightChangeKg;
          const e1rm = Number(record.e1rmKg) || (weight && reps ? weight * (1 + reps / 30) : weight);
          return (
            <Pressable key={record.exerciseId} accessibilityRole="button" accessibilityLabel={t('analyticsOpenProgress', { name })} onPress={() => navigation.navigate('AnalyticsExercise', { exerciseId: record.exerciseId, name })} style={styles.recordCard}>
              <View style={styles.recordHeading}><View style={styles.recordCopy}><Text numberOfLines={1} style={styles.recordName}>{name}</Text><Text style={styles.muted}>{t('analyticsLastSet')}: {lastWeight == null ? '—' : `${lastWeight} ${t('kgShort')}`}</Text></View><Ionicons color={theme.textPrimary} name="chevron-forward" size={20} /></View>
              <View style={styles.recordStats}>
                <Text style={styles.recordDetail}>{t('analyticsBest')}: {weight} {t('kgShort')} × {reps}</Text>
                <Text style={styles.recordDetail}>{t('analyticsOneRepMax')}: {e1rm.toFixed(0)} {t('kgShort')}</Text>
                {delta == null ? null : <Text style={styles.recordDelta}>{Number(delta) > 0 ? '+' : ''}{delta} {t('kgShort')}</Text>}
              </View>
            </Pressable>
          );
        }) : <View style={styles.card}><Text style={styles.muted}>{t('analyticsNoRecords')}</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
}