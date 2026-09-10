import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { apiFetch } from '../services/api';
import { createStyles } from './AnalyticsScreen.styles.js';

const skiaWebOptions = {
  locateFile: (file) => (file === 'canvaskit.wasm' ? '/web/static/js/canvaskit.wasm' : file),
};

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { t } = useContext(LanguageContext);
  const { userToken } = useContext(AuthContext);

  useEffect(() => {
    if (Platform.OS === 'web') {
      LoadSkiaWeb(skiaWebOptions).catch((caught) => {
        console.warn('Unable to initialize Skia web CanvasKit for analytics chart:', caught);
      });
    }
  }, []);

  const [exerciseIds, setExerciseIds] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loadingIds, setLoadingIds] = useState(false);
  const [loadingSets, setLoadingSets] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [chartComponents, setChartComponents] = useState(null);
  const [error, setError] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const startChart = async () => {
      try {
        if (Platform.OS === 'web') {
          await LoadSkiaWeb(skiaWebOptions);
        }

        const chart = require('victory-native');
        if (!cancelled) {
          setChartComponents({ CartesianChart: chart.CartesianChart, Scatter: chart.Scatter });
          setChartReady(true);
        }
      } catch (caught) {
        console.warn('Unable to prepare chart renderer:', caught);
        if (!cancelled) {
          setChartReady(false);
          setError('Chart renderer failed to load');
        }
      }
    };

    startChart();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedExercise = useMemo(() => {
    return exerciseIds.find((item) => item.id === selectedExerciseId || item.exerciseId === selectedExerciseId) || null;
  }, [exerciseIds, selectedExerciseId]);

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

  useEffect(() => {
    const loadSets = async () => {
      if (!selectedExerciseId || !userToken) {
        setChartData([]);
        return;
      }

      setLoadingSets(true);
      setError('');

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
        setChartData(plotted);
      } catch (caught) {
        setError(caught.message || 'Failed to load sets');
      } finally {
        setLoadingSets(false);
      }
    };

    loadSets();
  }, [selectedExerciseId, userToken]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{t('analytics')}</Text>
          <Text style={styles.subtitle}>Exercise analytics</Text>
        </View>

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
          ) : !chartReady || !chartComponents ? (
            <Text style={styles.loadingText}>Loading chart engine...</Text>
          ) : chartData.length === 0 ? (
            <Text style={styles.emptyText}>No set data available</Text>
          ) : (
            <View style={styles.chartFrame}>
              <chartComponents.CartesianChart
                data={chartData}
                xKey="weight"
                yKeys={['reps']}
                domainPadding={{ x: 16, y: 16 }}
                axisOptions={{
                  lineColor: theme.border,
                  labelColor: theme.textPrimary,
                  tickLabelColor: theme.textSecondary,
                }}
              >
                {({ points }) => <chartComponents.Scatter points={points.reps} radius={7} color={theme.primary} />}
              </chartComponents.CartesianChart>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}