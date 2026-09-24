import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BubbleChart } from 'react-native-gifted-charts';

import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { apiFetch } from '../services/api';
import { bodyMetricsService } from '../services/bodyMetricsService';
import { formatMetric, formatMetricDelta, periodToDateRange } from '../utils/bodyMetrics';
import { createStyles } from './AnalyticsScreen.styles.js';


const getBestFitLine = (data) => {
  const n = data.length;

  const sumX = data.reduce((sum, p) => sum + p.x, 0);
  const sumY = data.reduce((sum, p) => sum + p.y, 0);
  const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = data.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope =
    (n * sumXY - sumX * sumY) /
    (n * sumX2 - sumX * sumX);

  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

export default function AnalyticsScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const { userToken } = useContext(AuthContext);

  const [exerciseIds, setExerciseIds] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loadingIds, setLoadingIds] = useState(false);
  const [loadingSets, setLoadingSets] = useState(false);
  const [error, setError] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [bodyMetrics, setBodyMetrics] = useState(null);
  const [bodyMetricsLoading, setBodyMetricsLoading] = useState(true);
  const bodyMetricsRequestId = useRef(0);

  const selectedExercise = useMemo(() => {
    return exerciseIds.find((item) => item.id === selectedExerciseId || item.exerciseId === selectedExerciseId) || null;
  }, [exerciseIds, selectedExerciseId]);

  // Refetch on focus so the preview reflects a measurement added on the details screen.
  useFocusEffect(useCallback(() => {
    if (!userToken) return undefined;
    const id = ++bodyMetricsRequestId.current;
    setBodyMetricsLoading(true);
    bodyMetricsService.get(userToken, periodToDateRange('7')).then((data) => {
      if (id === bodyMetricsRequestId.current) setBodyMetrics(data);
    }).catch(() => {
      if (id === bodyMetricsRequestId.current) setBodyMetrics(null);
    }).finally(() => {
      if (id === bodyMetricsRequestId.current) setBodyMetricsLoading(false);
    });
    return () => { bodyMetricsRequestId.current += 1; };
  }, [userToken]));

  useEffect(() => {
    const loadExerciseIds = async () => {
      if (!userToken) return;

      setLoadingIds(true);
      setError('');

      try {
        const response = await apiFetch('/workouts/exercise-ids', {}, userToken);
        // console.log(response);
        if (!response.ok) {
          throw new Error(response.data?.message || 'Failed to load exercises');
        }

        const payload = Array.isArray(response.data) ? response.data : (response.data?.exerciseIds || []);
        console.log(payload)
        const normalized = payload.map((item) => {
          if (typeof item === 'object' && item !== null) {
            return {
              id: item.id ?? item.exerciseId ?? item.exercise_id,
              exerciseId: item.exerciseId ?? item.id ?? item.exercise_id,
              name: item.name ?? item.exerciseName ?? item.title ?? `Exercise ${item.id ?? item.exerciseId ?? item.exercise_id}`,
            };
          }
          return { id: item, exerciseId: item, name: `Exercise ${item}` };
        });

        setExerciseIds(normalized);
        if (normalized.length > 0) {
          setSelectedExerciseId(normalized[0].exerciseId);
        } else {
          setSelectedExerciseId(null);
        }
      } catch (caught) {
        setError(caught.message || 'Failed to load exercises');
      } finally {
        setLoadingIds(false);
      }
    };

    loadExerciseIds();
  }, [userToken]);

  let maxY = 0

  useEffect(() => {
    const loadSets = async () => {
      if (!selectedExerciseId || !userToken) {
        setChartData([]);
        return;
      }

      setLoadingSets(true);
      setError('');

      let dataToSet = []

      

      try {
        const response = await apiFetch(`/workouts/exercise/${selectedExerciseId}/sets`, {}, userToken);
        if (!response.ok) {
          throw new Error(response.data?.message || 'Failed to load sets');
        }

        const rawSets = Array.isArray(response.data) ? response.data : (response.data?.sets || []);
        const dedupedByWeight = new Map();
        const dedupedByReps = new Map();

        for (const set of rawSets) {
          const weight = Number(set.weight ?? 0);
          const reps = Number(set.reps ?? 0);
          if (!Number.isFinite(weight) || !Number.isFinite(reps)) continue;

          const byWeightKey = String(weight);
          const bestByWeight = dedupedByWeight.get(byWeightKey);
          if (!bestByWeight || reps > Number(bestByWeight.reps)) {
            dedupedByWeight.set(byWeightKey, { weight, reps });
          }

          const byRepsKey = String(reps);
          const bestByReps = dedupedByReps.get(byRepsKey);
          if (!bestByReps || weight > Number(bestByReps.weight)) {
            dedupedByReps.set(byRepsKey, { weight, reps });
          }
        }

        const points = new Map();
        Array.from(dedupedByWeight.values()).forEach((row) => {
          points.set(`${row.weight}-${row.reps}`, { weight: row.weight, reps: row.reps });
        });
        Array.from(dedupedByReps.values()).forEach((row) => {
          points.set(`${row.weight}-${row.reps}`, { weight: row.weight, reps: row.reps });
        });

        const plotted = Array.from(points.values());
        // setChartData(plotted.map((row) => ({ x: row.weight, y: row.reps, r: 7 })));
        dataToSet = plotted.map((row) => ({ x: row.weight, y: row.reps, r: 7 }));
      } catch (caught) {
        setError(caught.message || 'Failed to load sets');
      } finally {
        setLoadingSets(false);
      }

      let lineOfBestFit = getBestFitLine(dataToSet);
      // reps = slope * weight + intercept
      // therefore weight = (reps - intercept) / slope
      let oneRepMaxWeight = (1 - lineOfBestFit.intercept) / lineOfBestFit.slope;
      dataToSet = [...dataToSet, {x: oneRepMaxWeight, y: 1, bubbleColor: '#ffb700', r: 7, label: `1RM*: ${oneRepMaxWeight.toFixed(1)}kg` }];

      maxY = Math.ceil(Math.max(...dataToSet.map(item => item.y)) / 100) * 100 + 100;
      setChartData(dataToSet);
    };

   

    

    loadSets();
  }, [selectedExerciseId, userToken]);

  // const font = useFont(InterRegular, 12);

  console.log(chartData)
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{t('analytics')}</Text>
          <Text style={styles.subtitle}>Exercise analytics</Text>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel={t('bodyMetricsPreview')} onPress={() => navigation.navigate('BodyMetricsDetails', { period: '7' })} style={styles.bodyMetricsCard}>
          <View style={styles.bodyMetricsHeader}>
            <Text style={styles.bodyMetricsTitle}>{t('bodyMetricsPreview')}</Text>
            <Text style={styles.bodyMetricsLink}>{t('bodyMetrics')}</Text>
          </View>
          {bodyMetricsLoading ? <Text style={styles.bodyMetricsMuted}>{t('loading')}</Text> : (
            <View style={styles.bodyMetricsGrid}>
              {[
                ['weight', 'bodyMetricsWeight'],
                ['bodyFatPercentage', 'bodyMetricsFat'],
                ['muscleMass', 'bodyMetricsMuscle'],
                ['waistCircumference', 'bodyMetricsWaist'],
              ].map(([key, labelKey]) => {
                const item = bodyMetrics?.metrics?.[key];
                return <View key={key} style={styles.bodyMetricsItem}>
                  <Text style={styles.bodyMetricsLabel}>{t(labelKey)}</Text>
                  <Text style={styles.bodyMetricsValue}>{item?.latest ? formatMetric(item.latest.value, key, locale, t) : '—'}</Text>
                  <Text style={styles.bodyMetricsDelta}>{item?.change === null || item?.change === undefined ? '—' : formatMetricDelta(item.change, key, locale, t)}</Text>
                </View>;
              })}
            </View>
          )}
        </Pressable>

        <View style={styles.selectorWrap}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Exercise analytics selector"
            activeOpacity={0.9}
            style={styles.dropdownButton}
            onPress={() => setDropdownVisible((visible) => !visible)}
          >
            <Text style={styles.dropdownButtonText}>
              {selectedExercise?.name || (loadingIds ? 'Loading exercises...' : 'Select exercise')}
            </Text>
          </TouchableOpacity>

          {dropdownVisible && (
            <View style={styles.dropdownList}>
              {exerciseIds.map((exercise) => (
                <TouchableOpacity
                  key={exercise.exerciseId ?? exercise.id}
                  activeOpacity={0.85}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedExerciseId(exercise.exerciseId ?? exercise.id);
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{exercise.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {selectedExercise?.name ? `${selectedExercise.name} sets` : 'Set chart'}
          </Text>
          {loadingIds || loadingSets ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : error ? (
            <Text style={styles.emptyText}>{error}</Text>
          ) : chartData.length === 0 ? (
            <Text style={styles.emptyText}>No set data available</Text>
          ) : (
            <View style={styles.chartFrame}>
              <Text style={styles.yAxisTitle}>Reps</Text>
              <BubbleChart
                data={chartData}
                scatterChart
                height={250}
                width={400}
                endSpacing={20}
                yNoOfSections={5}
                xNoOfSections={5}
                
                yAxisColor={theme.border}
                xAxisColor={theme.border}
                rulesColor={theme.border}
                yAxisTextStyle={{ color: theme.textSecondary }}
                xAxisLabelTextStyle={{ color: theme.textSecondary }}
                bubblesColor={theme.primary}
                formatXLabel={(label) => String(label)}
                formatYLabel={(label) => String(label)}
                // maxValue={maxY}
                // yAxisOffset={0}
                // xAxisOffset={0}
                labelTextStyle={{ color: 'white' }}
              />
              <Text style={styles.xAxisTitle}>Weight</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
