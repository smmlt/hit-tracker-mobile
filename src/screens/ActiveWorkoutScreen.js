import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActiveExerciseCard } from '../components/workout/ActiveExerciseCard';
import { ExerciseDetailsModal } from '../components/exercise/ExerciseDetailsModal';
import { ConfirmDialog } from '../components/feedback';
import { AuthContext } from '../context/AuthContext';
import { WorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { translateCatalogName } from '../localization/catalog';
import { apiFetch } from '../services/api';
import { exercisePlanProgress, replaceRecordedSet } from '../utils/activeWorkout';
import { formatTimer } from '../utils/formatters';
import { programExercises as fromProgram } from '../utils/library';
import { palette } from '../constants/colors';
import { createStyles } from './ActiveWorkoutScreen.styles.js';

const activeSeconds = (workout, now) => {
  if (!workout?.createdAt) return 0;
  const total = Math.max(0, Math.floor((now - new Date(workout.createdAt).getTime()) / 1000));
  const currentPause = workout.status === 'paused' && workout.pausedAt
    ? Math.max(0, Math.floor((now - new Date(workout.pausedAt).getTime()) / 1000))
    : 0;
  return Math.max(0, total - (workout.pausedSeconds || 0) - currentPause);
};

const planFromSnapshot = (workout) => (workout?.historySnapshot?.plan || []).map((item) => ({
  id: item.exerciseId,
  name: item.name,
  exercise: { id: item.exerciseId, name: item.name },
  reps: item.reps,
  sets: item.sets,
  weight: item.weight,
}));

export default function ActiveWorkoutScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const { userToken } = useContext(AuthContext);
  const {
    activeWorkout,
    cancelWorkout,
    clearPreparedWorkout,
    finishWorkout,
    isLoading,
    loggedSets,
    prepareWorkout,
    preparedWorkout,
    setLoggedSets,
    setActiveWorkout,
    startWorkout,
    togglePauseWorkout,
  } = useContext(WorkoutContext);
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const styles = createStyles(theme, compact);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);
  const [finishedPlan, setFinishedPlan] = useState([]);
  const [finishedTitle, setFinishedTitle] = useState('');
  const [finishOpen, setFinishOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [now, setNow] = useState(Date.now());
  const [pendingSaves, setPendingSaves] = useState(0);
  const [checkingProgram, setCheckingProgram] = useState(false);
  const [result, setResult] = useState(null);
  const [resultError, setResultError] = useState('');
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const plan = result ? finishedPlan : preparedWorkout?.exercises || planFromSnapshot(activeWorkout);
  const title = result
    ? finishedTitle
    : preparedWorkout?.title || activeWorkout?.type || route.params?.program?.name || t('workout');
  const displayTitle = translateCatalogName(t, 'program', title);
  const scheduleId = preparedWorkout?.scheduleId || route.params?.assignment?.id;
  const paused = activeWorkout?.status === 'paused';
  const elapsed = activeSeconds(activeWorkout, now);
  const totalTime = activeWorkout
    ? Math.max(0, Math.floor((now - new Date(activeWorkout.createdAt).getTime()) / 1000))
    : 0;

  const setsFor = useCallback(
    (exerciseId) => loggedSets.filter((set) => set.exerciseId === exerciseId),
    [loggedSets],
  );
  const plannedSets = useMemo(
    () => plan.reduce((total, item) => total + (Number(item.sets) || 0), 0),
    [plan],
  );
  const isPlanComplete = useMemo(
    () => !!plan.length && plan.every((item) => exercisePlanProgress(item, setsFor(item.id)).complete),
    [plan, setsFor],
  );
  const incompleteMessage = useMemo(() => {
    const rows = plan.flatMap((item) => {
      const progress = exercisePlanProgress(item, setsFor(item.id));
      const missing = [
        progress.actualSets < progress.plannedSets
          ? t('incompleteSets', { actual: progress.actualSets, planned: progress.plannedSets })
          : null,
        progress.actualReps < progress.targetReps
          ? t('incompleteReps', { actual: progress.actualReps, planned: progress.targetReps })
          : null,
      ].filter(Boolean);
      return missing.length
        ? [`• ${translateCatalogName(t, 'exercise', item.name)}: ${missing.join(', ')}`]
        : [];
    });
    return `${t('finishIncompleteIntro')}\n${rows.join('\n')}\n\n${t('finishIncompleteContinue')}`;
  }, [plan, setsFor, t]);

  useEffect(() => {
    if (preparedWorkout && result) setResult(null);
  }, [preparedWorkout, result]);

  useEffect(() => {
    if (!activeWorkout?.programId || plan.length) return;
    apiFetch(`/workout-programs/${activeWorkout.programId}`, {}, userToken).then((response) => {
      if (response.ok) {
        prepareWorkout((current) => current?.exercises?.length ? current : {
          exercises: fromProgram(response.data),
          programId: response.data.id,
          title: response.data.name,
        });
      }
    });
  }, [activeWorkout?.programId, plan.length, prepareWorkout, userToken]);

  useEffect(() => {
    if (route.params?.program && !preparedWorkout && !result) {
      prepareWorkout({
        exercises: fromProgram(route.params.program),
        programId: route.params.program.id,
        title: route.params.program.name,
      });
    }
  }, [prepareWorkout, preparedWorkout, result, route.params?.program]);

  useEffect(() => {
    if (!activeWorkout || paused) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeWorkout, paused]);

  const begin = () => startWorkout(
    title,
    scheduleId,
    preparedWorkout || { exercises: plan, programId: route.params?.program?.id },
  );

  const saveSet = async (item, values, existingSet) => {
    if (!activeWorkout) return false;
    setPendingSaves((count) => count + 1);
    try {
      const response = await apiFetch(
        existingSet
          ? `/workouts/${activeWorkout.id}/sets/${existingSet.id}`
          : `/workouts/${activeWorkout.id}/sets`,
        {
          method: existingSet ? 'PATCH' : 'POST',
          body: JSON.stringify(existingSet ? values : { exerciseId: item.id, ...values }),
        },
        userToken,
      );
      if (!response.ok || !response.data?.set) return false;
      if (response.data.workout) setActiveWorkout(response.data.workout);
      setLoggedSets((current) => replaceRecordedSet(current, {
        ...existingSet,
        ...response.data.set,
        exerciseName: item.name,
      }));
      return true;
    } finally {
      setPendingSaves((count) => Math.max(0, count - 1));
    }
  };

  const removeExercise = (id) => {
    prepareWorkout((current) => ({
      ...current,
      exercises: (current?.exercises || plan).filter((item) => item.id !== id),
    }));
    if (expandedExerciseId === id) setExpandedExerciseId(null);
  };

  const finish = async () => {
    setFinishedPlan(plan);
    setFinishedTitle(title);
    const completedWorkout = await finishWorkout(notes);
    if (!completedWorkout) return;
    setFinishOpen(false);
    const rpeSets = loggedSets.filter((set) => set.rpe);
    const plannedReps = plan.reduce(
      (total, item) => total + (Number(item.sets) || 0) * (Number(item.reps) || 0),
      0,
    );
    const actualReps = loggedSets.reduce((total, set) => total + (Number(set.reps) || 0), 0);
    setResult({
      actualReps,
      avgRpe: rpeSets.reduce((sum, set) => sum + set.rpe, 0) / (rpeSets.length || 1),
      elapsed: typeof completedWorkout.durationSeconds === 'number'
        ? completedWorkout.durationSeconds
        : elapsed,
      exerciseIds: plan.map((item) => item.id).filter(Number.isInteger),
      exercises: plan.length,
      failure: loggedSets.filter((set) => set.isFailure).length,
      plannedReps,
      sets: loggedSets.length,
      totalTime: completedWorkout.finishedAt
        ? Math.max(0, Math.floor((new Date(completedWorkout.finishedAt).getTime() - new Date(completedWorkout.createdAt).getTime()) / 1000))
        : totalTime,
      volume: loggedSets.reduce((sum, set) => sum + set.weight * set.reps, 0),
      programDraft: {
        description: '',
        exercises: plan.map((item) => ({
          exerciseId: item.id,
          reps: Number(item.reps) || undefined,
          sets: Math.max(Number(item.sets) || 1, setsFor(item.id).length),
          week: 1,
          weekDay: 0,
          weight: Number(item.weight) || 0,
        })),
        name: `${title} ${t('copySuffix')}`,
      },
    });
  };

  const returnToTrainingPlan = () => navigation.navigate('TrainingHome');

  const completeResult = async () => {
    if (checkingProgram || !result) return;
    if (!result.exerciseIds.length) {
      returnToTrainingPlan();
      return;
    }
    setCheckingProgram(true);
    setResultError('');
    try {
      const response = await apiFetch('/workout-programs/match', {
        method: 'POST',
        body: JSON.stringify({ exerciseIds: result.exerciseIds }),
      }, userToken);
      if (!response.ok || !response.data) throw new Error('match failed');
      if (response.data.programId) {
        returnToTrainingPlan();
        return;
      }
      setSavePromptOpen(true);
    } catch {
      setResultError(t('saveProgramCheckFailed'));
    } finally {
      setCheckingProgram(false);
    }
  };

  const createProgramFromResult = () => {
    setSavePromptOpen(false);
    const tabs = navigation.getParent();
    if (!tabs) {
      returnToTrainingPlan();
      return;
    }
    tabs.navigate('Home', {
      screen: 'WorkshopHome',
      params: { createProgram: result.programDraft },
    });
  };

  if (!activeWorkout && !plan.length) {
    return <SafeAreaView style={styles.safe}>
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t('noWorkoutSelected')}</Text>
        <Text style={styles.muted}>{t('selectWorkoutHint')}</Text>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.link}>{t('backToTrainingPlan')}</Text></Pressable>
      </View>
    </SafeAreaView>;
  }

  if (result) {
    const completion = result.plannedReps
      ? Math.min(100, Math.round(result.actualReps / result.plannedReps * 100))
      : 0;
    return <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.result} showsVerticalScrollIndicator={false}>
        <View style={styles.resultHeader}>
          <Ionicons color={theme.success} name="checkmark-circle" size={25} />
          <Text style={styles.resultHeaderText}>{t('workoutComplete').toUpperCase()}</Text>
        </View>
        <Text style={styles.resultProgramTitle}>{displayTitle}</Text>
        <View style={styles.resultMetricGrid}>
          <View style={styles.resultMetricCard}>
            <Ionicons color={theme.primary} name="time-outline" size={22} />
            <Text style={styles.resultMetricLabel}>{t('activeTime')}</Text>
            <Text style={styles.resultMetricValue}>{formatTimer(result.elapsed)}</Text>
            <Text style={styles.resultMetricCaption}>{t('totalTime')}: {formatTimer(result.totalTime)}</Text>
          </View>
          <View style={styles.resultMetricCard}>
            <Ionicons color={theme.primary} name="barbell-outline" size={22} />
            <Text style={styles.resultMetricLabel}>{t('exercises')}</Text>
            <Text style={styles.resultMetricValue}>{result.exercises}</Text>
          </View>
          <View style={styles.resultMetricCard}>
            <Ionicons color={theme.primary} name="layers-outline" size={22} />
            <Text style={styles.resultMetricLabel}>{t('setsShort')}</Text>
            <Text style={styles.resultMetricValue}>{result.sets}</Text>
          </View>
          <View style={styles.resultMetricCard}>
            <Ionicons color={theme.primary} name="trending-up-outline" size={22} />
            <Text style={styles.resultMetricLabel}>{t('planCompletion')}</Text>
            <Text style={[styles.resultMetricValue, styles.resultMetricSuccess]}>{result.plannedReps ? `${completion}%` : '—'}</Text>
          </View>
        </View>
        <View style={[styles.resultMetricCard, styles.resultWideMetric]}>
          <Ionicons color={theme.primary} name="bar-chart-outline" size={23} />
          <View>
            <Text style={styles.resultMetricLabel}>{t('volume')}</Text>
            <Text style={styles.resultWideValue}>{Math.round(result.volume)} {t('kilogramsShort')}</Text>
          </View>
        </View>
        <View style={styles.resultMetricGrid}>
          <View style={styles.resultMetricCard}>
            <Text style={styles.resultMetricLabel}>{t('averageRpe')}</Text>
            <Text style={styles.resultMetricValue}>{result.avgRpe ? result.avgRpe.toFixed(1) : '—'}</Text>
          </View>
          <View style={styles.resultMetricCard}>
            <Text style={styles.resultMetricLabel}>{t('failureSets')}</Text>
            <Text style={styles.resultMetricValue}>{result.failure}</Text>
          </View>
        </View>
        {!!resultError && <Text style={styles.resultError}>{resultError}</Text>}
        <Pressable accessibilityRole="button" disabled={checkingProgram} onPress={completeResult} style={[styles.resultDoneButton, checkingProgram && styles.disabled]}>
          {checkingProgram ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={styles.resultDoneText}>{t('done')}</Text>}
        </Pressable>
      </ScrollView>
      <Modal animationType="fade" onRequestClose={returnToTrainingPlan} transparent visible={savePromptOpen}>
        <View style={styles.savePromptOverlay}>
          <View style={styles.savePrompt}>
            <Pressable accessibilityLabel={t('close')} accessibilityRole="button" onPress={returnToTrainingPlan} style={styles.savePromptClose}>
              <Ionicons color={theme.textPrimary} name="close" size={30} />
            </Pressable>
            <Text style={styles.savePromptTitle}>{t('saveWorkoutAsProgram')}</Text>
            <Pressable accessibilityRole="button" onPress={createProgramFromResult} style={styles.savePromptConfirm}>
              <Text style={styles.savePromptConfirmText}>{t('yes')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>;
  }

  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons color={theme.textPrimary} name="chevron-back" size={26} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('activeWorkout').toUpperCase()}</Text>
        <View style={styles.headerButton} />
      </View>

      <Text style={styles.timerValue}>{formatTimer(activeWorkout ? elapsed : 0)}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={isLoading}
        onPress={activeWorkout ? togglePauseWorkout : begin}
        style={[styles.timerAction, paused && styles.resumeAction, isLoading && styles.disabled]}
      >
        {isLoading ? <ActivityIndicator color={palette.whitePure} /> : <>
          <Ionicons color={palette.whitePure} name={activeWorkout && !paused ? 'pause' : 'play'} size={26} />
          <Text style={styles.timerActionText}>
            {activeWorkout ? paused ? t('resume').toUpperCase() : t('pause').toUpperCase() : t('startWorkout').toUpperCase()}
          </Text>
        </>}
      </Pressable>
      {paused && <Text style={styles.pausedLabel}>{t('workoutPausedBanner')}</Text>}

      <View style={styles.programHeader}>
        <View style={styles.programTitleBlock}>
          <Text numberOfLines={2} style={styles.programTitle}>{displayTitle}</Text>
          <Text style={styles.exerciseCount}>{t('exercises')} ({plan.length})</Text>
        </View>
      </View>

      <View style={styles.exerciseList}>
        {plan.map((item, index) => <ActiveExerciseCard
          compact={compact}
          expanded={expandedExerciseId === item.id}
          index={index}
          item={item}
          key={item.id}
          onDetails={setSelectedExercise}
          onRemove={removeExercise}
          onSave={saveSet}
          onToggle={() => setExpandedExerciseId((current) => current === item.id ? null : item.id)}
          recordingDisabled={!activeWorkout}
          sets={setsFor(item.id)}
          t={t}
          theme={theme}
        />)}
      </View>

      {activeWorkout && <TextInput
        multiline
        onChangeText={setNotes}
        placeholder={t('workoutNotes')}
        placeholderTextColor={theme.textSecondary}
        style={[styles.notes, styles.workoutNotes]}
        value={notes}
      />}

      <Pressable
        accessibilityRole="button"
        disabled={!activeWorkout || pendingSaves > 0}
        onPress={() => setFinishOpen(true)}
        style={[
          styles.finishButton,
          activeWorkout && pendingSaves === 0 && styles.finishActive,
          (!activeWorkout || pendingSaves > 0) && styles.finishDisabled,
        ]}
      >
        <Text style={[styles.finishText, (!activeWorkout || pendingSaves > 0) && styles.finishTextDisabled]}>{t('finish')}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (activeWorkout) setCancelOpen(true);
          else { clearPreparedWorkout(); navigation.goBack(); }
        }}
        style={styles.cancelButton}
      >
        <Text style={styles.cancelText}>{t('cancelWorkout').replace('?', '')}</Text>
      </Pressable>
    </ScrollView>

    <ExerciseDetailsModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} visible={!!selectedExercise} />
    <ConfirmDialog
      cancelLabel={t('keepTraining')}
      confirmLabel={t('finish')}
      message={isPlanComplete ? t('finishSaveMessage') : incompleteMessage}
      onCancel={() => setFinishOpen(false)}
      onConfirm={finish}
      title={t('finishWorkout')}
      visible={finishOpen}
    />
    <ConfirmDialog
      cancelLabel={t('keepWorkout')}
      confirmLabel={t('cancelWorkout').replace('?', '')}
      message={t('cancelWorkoutMessage')}
      onCancel={() => setCancelOpen(false)}
      onConfirm={async () => { await cancelWorkout(); setCancelOpen(false); navigation.goBack(); }}
      title={t('cancelWorkout')}
      visible={cancelOpen}
    />
  </SafeAreaView>;
}
