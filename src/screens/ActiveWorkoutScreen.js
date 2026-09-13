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
  const [result, setResult] = useState(null);
  const [saveDescription, setSaveDescription] = useState('');
  const [saveName, setSaveName] = useState('');
  const [saveOpen, setSaveOpen] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
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

  const finish = async () => {
    setFinishedPlan(plan);
    setFinishedTitle(title);
    if (!await finishWorkout(notes, elapsed)) return;
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
      elapsed,
      exercises: new Set(loggedSets.map((set) => set.exerciseId)).size,
      failure: loggedSets.filter((set) => set.isFailure).length,
      plannedReps,
      sets: loggedSets.length,
      totalTime,
      volume: loggedSets.reduce((sum, set) => sum + set.weight * set.reps, 0),
    });
  };

  const saveAsPersonalProgram = async () => {
    if (!saveName.trim() || !plan.length) return;
    setSavingProgram(true);
    const response = await apiFetch('/workout-programs', {
      method: 'POST',
      body: JSON.stringify({
        description: saveDescription.trim() || undefined,
        exercises: plan.map((item) => ({
          exerciseId: item.id,
          reps: Number(item.reps) || undefined,
          sets: Math.max(Number(item.sets) || 1, setsFor(item.id).length),
          weekDay: 0,
          weight: Number(item.weight) || 0,
        })),
        name: saveName.trim(),
      }),
    }, userToken);
    setSavingProgram(false);
    if (response.ok) setSaveOpen(false);
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
      <ScrollView contentContainerStyle={styles.result}>
        <Text style={styles.eyebrow}>{t('workoutComplete').toUpperCase()}</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.resultCard}>
          {[
            [t('activeTime'), formatTimer(result.elapsed)],
            [t('totalTime'), formatTimer(result.totalTime)],
            [t('exercises'), String(result.exercises)],
            [t('setsShort'), `${result.sets}/${plannedSets}`],
            [t('planCompletion'), result.plannedReps ? `${completion}%` : '—'],
            [t('volume'), `${Math.round(result.volume)} ${t('kilogramsShort')}`],
            [t('averageRpe'), result.avgRpe ? result.avgRpe.toFixed(1) : '—'],
            [t('failureSets'), String(result.failure)],
          ].map(([label, value]) => <View key={label} style={styles.resultRow}>
            <Text style={styles.muted}>{label}</Text>
            <Text style={styles.resultValue}>{value}</Text>
          </View>)}
        </View>
        <Pressable onPress={() => { setSaveName(`${title} ${t('copySuffix')}`); setSaveOpen(true); }} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{t('saveAsProgram')}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('TrainingHome')} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{t('backToTrainingPlan')}</Text>
        </Pressable>
      </ScrollView>
      <Modal animationType="slide" onRequestClose={() => setSaveOpen(false)} presentationStyle="pageSheet" visible={saveOpen}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.saveForm}>
            <Text style={styles.sectionTitle}>{t('savePersonalProgram')}</Text>
            <Text style={styles.muted}>{t('personalCopyHint')}</Text>
            <TextInput onChangeText={setSaveName} placeholder={t('programName')} placeholderTextColor={theme.textSecondary} style={styles.notes} value={saveName} />
            <TextInput multiline onChangeText={setSaveDescription} placeholder={t('descriptionOptional')} placeholderTextColor={theme.textSecondary} style={styles.notes} value={saveDescription} />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setSaveOpen(false)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{t('cancel')}</Text></Pressable>
              <Pressable disabled={savingProgram || !saveName.trim()} onPress={saveAsPersonalProgram} style={[styles.primaryButton, (!saveName.trim() || savingProgram) && styles.disabled]}>
                <Text style={styles.primaryButtonText}>{savingProgram ? t('saving') : t('save')}</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
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
