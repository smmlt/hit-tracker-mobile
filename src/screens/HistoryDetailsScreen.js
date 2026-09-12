import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { translateCatalogName } from '../localization/catalog';
import { useTheme } from '../context/ThemeContext';
import { workoutsService } from '../services/workoutsService';
import { dateKey, parseDateKey } from '../utils/history';
import { createStyles } from './HistoryDetailsScreen.styles';

function durationParts(totalSeconds, t) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) return `${hours}${t('hourShort')} ${minutes}${t('minuteShort')}`;
  if (minutes) return `${minutes}${t('minuteShort')}`;
  return `${seconds}${t('secondShort')}`;
}

function SummaryTile({ icon, label, value, styles, theme }) {
  return (
    <View style={styles.summaryTile}>
      <Ionicons color={theme.primary} name={icon} size={18} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function ExerciseHistoryCard({ exercise, expanded, onToggle, styles, theme, t }) {
  const actualCount = exercise.actualSets.length;
  const planned = exercise.planned;
  return (
    <View style={styles.exerciseCard}>
      <Pressable accessibilityRole="button" onPress={onToggle} style={styles.exerciseHeader}>
        <View style={styles.exerciseHeading}>
          <Text style={styles.exerciseName}>{translateCatalogName(t, 'exercise', exercise.name)}</Text>
          <View style={styles.badges}>
            {exercise.addedDuringWorkout && <Text style={styles.addedBadge}>{t('addedDuringWorkout')}</Text>}
            {planned && !actualCount && <Text style={styles.missedBadge}>{t('notCompleted')}</Text>}
          </View>
          <Text style={styles.exerciseProgress}>
            {planned ? `${actualCount}/${planned.sets} ${t('setsShort')}` : `${actualCount} ${t('setsShort')}`}
          </Text>
        </View>
        <Ionicons color={theme.textSecondary} name={expanded ? 'chevron-up' : 'chevron-down'} size={20} />
      </Pressable>

      {expanded && (
        <View style={styles.exerciseBody}>
          {planned ? (
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>{t('plan')}</Text>
              <Text style={styles.planValue}>
                {planned.sets} × {planned.reps ?? '—'} · {planned.weight ?? '—'} {t('kilogramsShort')}
              </Text>
            </View>
          ) : (
            <Text style={styles.noPlan}>{t('noExercisePlan')}</Text>
          )}

          {actualCount ? (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.setCell]}>{t('setColumn')}</Text>
                <Text style={styles.tableCell}>{t('weightColumn')}</Text>
                <Text style={styles.tableCell}>{t('repsColumn')}</Text>
                <Text style={styles.tableCell}>{t('rpeColumn')}</Text>
                <Text style={styles.tableCell}>{t('failureColumn')}</Text>
              </View>
              {exercise.actualSets.map((set, index) => (
                <View key={set.id || index} style={styles.tableRow}>
                  <Text style={[styles.tableCellText, styles.setCell]}>{index + 1}</Text>
                  <Text style={styles.tableCellText}>{set.weight}</Text>
                  <Text style={styles.tableCellText}>{set.reps}</Text>
                  <Text style={styles.tableCellText}>{set.rpe ?? '—'}</Text>
                  <Text style={[styles.tableCellText, set.isFailure && styles.failureValue]}>{set.isFailure ? t('yes') : '—'}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noActualSets}>{t('noSetsRecorded')}</Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function HistoryDetailsScreen({ navigation, route }) {
  const { userToken } = useContext(AuthContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const tabBarHeight = useBottomTabBarHeight();
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const workoutId = route.params?.workoutId;
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await workoutsService.getHistoryDetails(userToken, workoutId);
      setDetails(result);
      setExpanded(result.exercises?.length ? new Set([result.exercises[0].exerciseId]) : new Set());
    } catch (loadError) {
      setError(loadError.message || t('historyDetailsLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t, userToken, workoutId]);

  useEffect(() => { load(); }, [load]);

  const toggleExercise = (exerciseId) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(exerciseId)) next.delete(exerciseId);
    else next.add(exerciseId);
    return next;
  });

  const openProgram = () => {
    if (!details?.programSource?.available || !details.programSource.id) return;
    navigation.getParent()?.navigate('Home', {
      screen: 'LibraryProgram',
      params: { programId: details.programSource.id },
    });
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel={t('back')} onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons color={theme.textPrimary} name="chevron-back" size={23} />
          </Pressable>
          <Text style={styles.topBarTitle}>{t('workoutDetails')}</Text>
          <View style={styles.backButton} />
        </View>
        <ActivityIndicator color={theme.primary} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (error || !details) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel={t('back')} onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons color={theme.textPrimary} name="chevron-back" size={23} />
          </Pressable>
          <Text style={styles.topBarTitle}>{t('workoutDetails')}</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{t('historyDetailsLoadFailed')}</Text>
          <Pressable onPress={load} style={styles.retryButton}><Text style={styles.retryText}>{t('tryAgain')}</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { workout, summary, exercises, programSource } = details;
  const completedAt = new Date(workout.finishedAt);
  const completedDay = dateKey(completedAt);
  const scheduledDiffers = workout.scheduledFor && workout.scheduledFor !== completedDay;
  const displayTitle = programSource?.name
    ? translateCatalogName(t, 'program', programSource.name)
    : workout.title || t('workout');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel={t('back')} onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons color={theme.textPrimary} name="chevron-back" size={23} />
        </Pressable>
        <Text style={styles.topBarTitle}>{t('workoutDetails')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 30 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.completedLabel}>{t('completed').toUpperCase()}</Text>
          <Text style={styles.title}>{displayTitle}</Text>
          <Text style={styles.date}>
            {completedAt.toLocaleString(localeTag, {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryTile icon="timer-outline" label={t('activeTime')} value={durationParts(summary.activeDurationSeconds, t)} styles={styles} theme={theme} />
          <SummaryTile icon="hourglass-outline" label={t('totalTime')} value={durationParts(summary.totalDurationSeconds, t)} styles={styles} theme={theme} />
          <SummaryTile icon="barbell-outline" label={t('exercises')} value={summary.exerciseCount} styles={styles} theme={theme} />
          <SummaryTile icon="layers-outline" label={t('performedSets')} value={summary.setCount} styles={styles} theme={theme} />
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statRow}><Text style={styles.statLabel}>{t('volume')}</Text><Text style={styles.statValue}>{Math.round(summary.volume)} {t('kilogramsShort')}</Text></View>
          <View style={styles.divider} />
          <View style={styles.statRow}><Text style={styles.statLabel}>{t('averageRpe')}</Text><Text style={styles.statValue}>{summary.averageRpe === null ? '—' : summary.averageRpe.toFixed(1)}</Text></View>
          <View style={styles.divider} />
          <View style={styles.statRow}><Text style={styles.statLabel}>{t('failureSets')}</Text><Text style={styles.statValue}>{summary.failureSets}</Text></View>
          <View style={styles.divider} />
          <View style={styles.statRow}><Text style={styles.statLabel}>{t('planCompletion')}</Text><Text style={styles.statValue}>{summary.completionPercent === null ? '—' : `${summary.completionPercent}%`}</Text></View>
        </View>

        {(programSource || workout.scheduledFor) && (
          <View style={styles.sourceCard}>
            {!!programSource && (
              <Pressable disabled={!programSource.available} onPress={openProgram} style={styles.sourceRow}>
                <View style={styles.sourceText}>
                  <Text style={styles.sourceLabel}>{t('workoutProgram')}</Text>
                  <Text style={[styles.sourceValue, programSource.available && styles.sourceLink]}>{translateCatalogName(t, 'program', programSource.name)}</Text>
                  {!programSource.available && <Text style={styles.unavailable}>{t('programUnavailable')}</Text>}
                </View>
                {programSource.available && <Ionicons color={theme.primary} name="chevron-forward" size={19} />}
              </Pressable>
            )}
            {!!workout.scheduledFor && (
              <View style={[styles.sourceRow, programSource && styles.sourceDivider]}>
                <View style={styles.sourceText}>
                  <Text style={styles.sourceLabel}>{t('scheduledFor')}</Text>
                  <Text style={styles.sourceValue}>{parseDateKey(workout.scheduledFor).toLocaleDateString(localeTag, { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                  {scheduledDiffers && <Text style={styles.scheduleNote}>{t('completedOnDifferentDay')}</Text>}
                </View>
              </View>
            )}
          </View>
        )}

        {!details.hasPlanSnapshot && (
          <View style={styles.notice}>
            <Ionicons color={theme.textSecondary} name="information-circle-outline" size={19} />
            <Text style={styles.noticeText}>{t('historyPlanUnavailable')}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('exercises')}</Text>
        {exercises.map((exercise) => (
          <ExerciseHistoryCard
            exercise={exercise}
            expanded={expanded.has(exercise.exerciseId)}
            key={exercise.exerciseId}
            onToggle={() => toggleExercise(exercise.exerciseId)}
            styles={styles}
            t={t}
            theme={theme}
          />
        ))}

        {!exercises.length && <Text style={styles.noActualSets}>{t('noSetsRecorded')}</Text>}

        {!!workout.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>{t('notes')}</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
