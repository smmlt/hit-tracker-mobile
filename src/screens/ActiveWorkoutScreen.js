/**
 * Runs the active workout flow, reading the prepared session and exercise progress from workout state, while handling pause, completion, cancellation, and exercise logging side effects. / Керує активним тренуванням, читаючи підготовлену сесію та прогрес вправ зі стану тренування, а також обробляючи паузу, завершення, скасування й збереження підходів.
 */
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ActiveExerciseCard } from '../components/workout/ActiveExerciseCard';
import { ExerciseDetailsModal } from '../components/exercise/ExerciseDetailsModal';
import { ConfirmDialog } from '../components/feedback';
import { AuthContext } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { translateCatalogName } from '../localization/catalog';
import { apiFetch } from '../services/api';
import { exercisePlanProgress, replaceRecordedSet, workoutPlanCompletion } from '../utils/activeWorkout';
import { formatTimer } from '../utils/formatters';
import { programExercises as fromProgram } from '../utils/library';
import { palette } from '../constants/colors';
import { createStyles } from './ActiveWorkoutScreen.styles.js';
import { entityRef, isoDate } from '../utils/navigationPaths';
import CompletionCheck from '../assets/workout-completion/completion-check.svg';
import ActiveTimeIcon from '../assets/workout-completion/active-time.svg';
import TotalTimeIcon from '../assets/workout-completion/total-time.svg';
import ExercisesIcon from '../assets/workout-completion/exercises.svg';
import SetsIcon from '../assets/workout-completion/sets.svg';
import VolumeIcon from '../assets/workout-completion/volume.svg';
import PlanCompletionIcon from '../assets/workout-completion/plan-completion.svg';
import LogoLeft from '../assets/workout-completion/logo-left.svg';
import LogoTop from '../assets/workout-completion/logo-top.svg';
import LogoMiddle from '../assets/workout-completion/logo-middle.svg';

/** EN: Calculates active workout seconds after subtracting completed and current pauses. UK: Обчислює активні секунди тренування після віднімання завершених і поточної пауз. */
const activeSeconds = (workout, now) => {
  if (!workout?.createdAt) return 0;
  const total = Math.max(0, Math.floor((now - new Date(workout.createdAt).getTime()) / 1000));
  const currentPause = workout.status === 'paused' && workout.pausedAt
    ? Math.max(0, Math.floor((now - new Date(workout.pausedAt).getTime()) / 1000))
    : 0;
  return Math.max(0, total - (workout.pausedSeconds || 0) - currentPause);
};

/** EN: Reconstructs the displayable exercise plan from an immutable workout snapshot. UK: Відновлює придатний до показу план вправ із незмінного знімка тренування. */
const planFromSnapshot = (workout) => (workout?.historySnapshot?.plan || []).map(/* EN: Converts one snapshot row to the active-card shape. UK: Перетворює один рядок знімка на форму картки активної вправи. */ (item) => ({
  id: item.exerciseId,
  name: item.name,
  exercise: {
    id: item.exerciseId,
    name: item.name,
    measurementType: item.measurementType || 'reps',
    recommendedDurationSeconds: item.targetDurationSeconds,
  },
  reps: item.reps,
  durationSeconds: item.targetDurationSeconds,
  measurementType: item.measurementType || 'reps',
  sets: item.sets,
  weight: item.weight,
}));

/** EN: Coordinates preparation, live set logging, pause/cancel/finish transitions, and completion results. UK: Координує підготовку, запис підходів, переходи паузи/скасування/завершення та підсумки тренування. */
export default function ActiveWorkoutScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const compact = width <= 480;
  const { userToken } = useContext(AuthContext);
  const {
    activeWorkout,
    activeVerified,
    cancelWorkout,
    clearPreparedWorkout,
    completedWorkoutResult: result,
    finishWorkout,
    isLoading,
    loggedSets,
    prepareWorkout,
    preparedWorkout,
    setLoggedSets,
    setActiveWorkout,
    setCompletedWorkoutResult: setResult,
    startWorkout,
    togglePauseWorkout,
  } = useWorkout(useShallow(/* EN: Selects only workout state and actions required by this screen. UK: Вибирає лише стан і дії тренування, потрібні цьому екрану. */ (state) => ({
    activeWorkout: state.activeWorkout,
    activeVerified: state.activeVerified,
    cancelWorkout: state.cancelWorkout,
    clearPreparedWorkout: state.clearPreparedWorkout,
    completedWorkoutResult: state.completedWorkoutResult,
    finishWorkout: state.finishWorkout,
    isLoading: state.isLoading,
    loggedSets: state.loggedSets,
    prepareWorkout: state.prepareWorkout,
    preparedWorkout: state.preparedWorkout,
    setLoggedSets: state.setLoggedSets,
    setActiveWorkout: state.setActiveWorkout,
    setCompletedWorkoutResult: state.setCompletedWorkoutResult,
    startWorkout: state.startWorkout,
    togglePauseWorkout: state.togglePauseWorkout,
  })));
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const styles = createStyles(theme, compact);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [now, setNow] = useState(Date.now());
  const [pendingSaves, setPendingSaves] = useState(0);
  const [checkingProgram, setCheckingProgram] = useState(false);
  const [resultError, setResultError] = useState('');
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [durationDraftExerciseIds, setDurationDraftExerciseIds] = useState(() => new Set());

  const plan = result ? result.plan || [] : preparedWorkout?.exercises || planFromSnapshot(activeWorkout);
  const title = result
    ? result.title
    : preparedWorkout?.title || activeWorkout?.type || route.params?.program?.name || t('workout');
  const displayTitle = translateCatalogName(t, 'program', title);
  const scheduleId = preparedWorkout?.scheduleId || route.params?.assignment?.id;
  const paused = activeWorkout?.status === 'paused';
  const elapsed = activeSeconds(activeWorkout, now);
  const totalTime = activeWorkout
    ? Math.max(0, Math.floor((now - new Date(activeWorkout.createdAt).getTime()) / 1000))
    : 0;

  const setsFor = useCallback(
    /* EN: Returns recorded sets belonging to one exercise. UK: Повертає записані підходи, що належать одній вправі. */ (exerciseId) => loggedSets.filter(/* EN: Matches a set to the requested exercise identifier. UK: Зіставляє підхід із запитаним ідентифікатором вправи. */ (set) => set.exerciseId === exerciseId),
    [loggedSets],
  );
  const setDurationDraftState = useCallback((exerciseId, active) => {
    setDurationDraftExerciseIds((current) => {
      const next = new Set(current);
      if (active) next.add(exerciseId);
      else next.delete(exerciseId);
      return next;
    });
  }, []);
  const plannedSets = useMemo(
    /* EN: Computes the total planned set count for progress display. UK: Обчислює загальну заплановану кількість підходів для показу прогресу. */ () => plan.reduce(/* EN: Adds this exercise's planned sets to the total. UK: Додає заплановані підходи цієї вправи до загальної кількості. */ (total, item) => total + (Number(item.sets) || 0), 0),
    [plan],
  );
  const isPlanComplete = useMemo(
    /* EN: Reports whether every planned exercise has met its set and rep targets. UK: Визначає, чи кожна запланована вправа виконала цілі підходів і повторень. */ () => !!plan.length && plan.every(/* EN: Checks completion for one exercise against its recorded sets. UK: Перевіряє завершеність однієї вправи за її записаними підходами. */ (item) => exercisePlanProgress(item, setsFor(item.id)).complete),
    [plan, setsFor],
  );
  const incompleteMessage = useMemo(/* EN: Builds a localized explanation of unmet exercise targets before finishing. UK: Формує локалізоване пояснення невиконаних цілей вправ перед завершенням. */ () => {
    const rows = plan.flatMap(/* EN: Emits a warning row only for an incomplete exercise. UK: Створює рядок попередження лише для незавершеної вправи. */ (item) => {
      const progress = exercisePlanProgress(item, setsFor(item.id));
      const missing = [
        progress.actualSets < progress.plannedSets
          ? t('incompleteSets', { actual: progress.actualSets, planned: progress.plannedSets })
          : null,
        progress.actualReps < progress.targetReps
          ? t('incompleteReps', { actual: progress.actualReps, planned: progress.targetReps })
          : null,
        progress.actualDuration < progress.targetDuration
          ? t('incompleteDuration', { actual: progress.actualDuration, planned: progress.targetDuration })
          : null,
      ].filter(/* EN: Removes absent set or repetition warnings. UK: Видаляє відсутні попередження про підходи чи повторення. */ Boolean);
      return missing.length
        ? [`• ${translateCatalogName(t, 'exercise', item.name)}: ${missing.join(', ')}`]
        : [];
    });
    return `${t('finishIncompleteIntro')}\n${rows.join('\n')}\n\n${t('finishIncompleteContinue')}`;
  }, [plan, setsFor, t]);

  useEffect(/* EN: Clears stale completion results when a new prepared workout appears. UK: Очищає застарілий результат завершення після появи нового підготовленого тренування. */ () => {
    if (preparedWorkout && result) setResult(null);
  }, [preparedWorkout, result, setResult]);

  useEffect(/* EN: Reconciles the current route with the verified authoritative workout lifecycle. UK: Узгоджує поточний маршрут із перевіреним авторитетним життєвим циклом тренування. */ () => {
    if (!activeVerified) return;
    // These replacements keep preparation, session, and completion routes aligned with the authoritative workout lifecycle state. / Ці заміни узгоджують маршрути підготовки, сесії та завершення з авторитетним станом життєвого циклу тренування.
    if (route.name === 'WorkoutPreparation' && activeWorkout) {
      navigation.replace('WorkoutSession');
      return;
    }
    if (route.name === 'WorkoutPreparation' && !preparedWorkout) {
      navigation.replace('TrainingHome');
      return;
    }
    if (route.name === 'WorkoutSession' && !activeWorkout) {
      navigation.replace(preparedWorkout ? 'WorkoutPreparation' : 'TrainingHome');
      return;
    }
    if (route.name === 'WorkoutCompleted' && !result) {
      navigation.getParent()?.navigate('History', {
        screen: 'HistoryDetails',
        params: { date: route.params?.date, workoutRef: route.params?.workoutRef },
        initial: false,
      });
    }
  }, [activeVerified, activeWorkout, navigation, preparedWorkout, result, route.name, route.params?.date, route.params?.workoutRef]);

  useEffect(/* EN: Restores a missing active plan from its program when the snapshot lacks exercises. UK: Відновлює відсутній активний план із програми, якщо знімок не містить вправ. */ () => {
    if (!activeWorkout?.programId || plan.length) return;
    apiFetch(`/workout-programs/${activeWorkout.programId}`, {}, userToken).then(/* EN: Uses a successful program response to hydrate the prepared plan. UK: Використовує успішну відповідь програми для наповнення підготовленого плану. */ (response) => {
      if (response.ok) {
        prepareWorkout(/* EN: Preserves an already hydrated plan or installs the fetched exercises. UK: Зберігає вже наповнений план або встановлює завантажені вправи. */ (current) => current?.exercises?.length ? current : {
          exercises: fromProgram(response.data),
          programId: response.data.id,
          title: response.data.name,
        });
      }
    });
  }, [activeWorkout?.programId, plan.length, prepareWorkout, userToken]);

  useEffect(/* EN: Converts a program passed through navigation into prepared workout state once. UK: Один раз перетворює програму з навігації на стан підготовленого тренування. */ () => {
    if (route.params?.program && !preparedWorkout && !result) {
      prepareWorkout({
        exercises: fromProgram(route.params.program),
        programId: route.params.program.id,
        title: route.params.program.name,
      });
    }
  }, [prepareWorkout, preparedWorkout, result, route.params?.program]);

  useEffect(/* EN: Advances the live timer only while an active workout is not paused. UK: Оновлює живий таймер лише під час активного тренування без паузи. */ () => {
    if (!activeWorkout || paused) return undefined;
    const timer = setInterval(/* EN: Captures the current time for the next elapsed-time render. UK: Фіксує поточний час для наступного показу тривалості. */ () => setNow(Date.now()), 1000);
    return /* EN: Stops the timer when pausing, leaving, or replacing the workout. UK: Зупиняє таймер під час паузи, виходу або заміни тренування. */ () => clearInterval(timer);
  }, [activeWorkout, paused]);

  /** EN: Starts the prepared workout and replaces preparation with the live session. UK: Починає підготовлене тренування та замінює екран підготовки активною сесією. */
  const begin = async () => {
    const workout = await startWorkout(
      title,
      scheduleId,
      preparedWorkout || { exercises: plan, programId: route.params?.program?.id },
    );
    if (workout) navigation.replace('WorkoutSession');
  };

  /** EN: Creates or edits one set, reconciles returned workout state, and tracks pending saves. UK: Створює або редагує один підхід, узгоджує повернений стан тренування та відстежує незавершені збереження. */
  const saveSet = async (item, values, existingSet) => {
    if (!activeWorkout) return false;
    setPendingSaves(/* EN: Blocks finishing while this set mutation is pending. UK: Блокує завершення, поки ця зміна підходу очікує відповіді. */ (count) => count + 1);
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
      setLoggedSets(/* EN: Replaces an edited set or appends the newly recorded set. UK: Замінює відредагований підхід або додає щойно записаний. */ (current) => replaceRecordedSet(current, {
        ...existingSet,
        ...response.data.set,
        exerciseName: item.name,
      }));
      return true;
    } finally {
      setPendingSaves(/* EN: Releases the pending-save slot even after a failed request. UK: Звільняє місце очікуваного збереження навіть після невдалого запиту. */ (count) => Math.max(0, count - 1));
    }
  };

  /** EN: Removes one exercise from the mutable prepared plan and collapses it if open. UK: Видаляє одну вправу зі змінюваного підготовленого плану та згортає її, якщо вона відкрита. */
  const removeExercise = (id) => {
    prepareWorkout(/* EN: Produces prepared state without the removed exercise. UK: Формує підготовлений стан без видаленої вправи. */ (current) => ({
      ...current,
      exercises: (current?.exercises || plan).filter(/* EN: Keeps every exercise except the requested identifier. UK: Залишає всі вправи, крім запитаного ідентифікатора. */ (item) => item.id !== id),
    }));
    if (expandedExerciseId === id) setExpandedExerciseId(null);
  };

  /** EN: Finalizes the workout, derives completion statistics, and opens the immutable result route. UK: Завершує тренування, обчислює підсумкову статистику та відкриває незмінний маршрут результату. */
  const finish = async () => {
    const completedPlan = plan;
    const completedTitle = title;
    const completedWorkoutId = activeWorkout?.id;
    const completedWorkout = await finishWorkout(notes);
    if (!completedWorkout) return;
    setFinishOpen(false);
    const rpeSets = loggedSets.filter(/* EN: Keeps sets that contribute to average RPE. UK: Залишає підходи, що беруть участь у середньому RPE. */ (set) => set.rpe);
    const plannedReps = plan.reduce(
      /* EN: Adds this exercise's planned repetitions to the workout target. UK: Додає заплановані повторення цієї вправи до цілі тренування. */ (total, item) => total + (Number(item.sets) || 0) * (Number(item.reps) || 0),
      0,
    );
    const actualReps = loggedSets.reduce(/* EN: Totals repetitions actually recorded across all sets. UK: Підсумовує фактично записані повторення в усіх підходах. */ (total, set) => total + (Number(set.reps) || 0), 0);
    const completionPercent = workoutPlanCompletion(plan, setsFor);
    const nextResult = {
      actualReps,
      avgRpe: rpeSets.reduce(/* EN: Sums available RPE values for the result average. UK: Підсумовує наявні значення RPE для середнього результату. */ (sum, set) => sum + set.rpe, 0) / (rpeSets.length || 1),
      elapsed: typeof completedWorkout.durationSeconds === 'number'
        ? completedWorkout.durationSeconds
        : elapsed,
      exerciseIds: plan.map(/* EN: Extracts exercise identifiers for matching an existing program. UK: Витягує ідентифікатори вправ для пошуку відповідної програми. */ (item) => item.id).filter(Number.isInteger),
      exercises: plan.length,
      failure: loggedSets.filter(/* EN: Counts sets explicitly marked as muscular failure. UK: Підраховує підходи, явно позначені як виконані до відмови. */ (set) => set.isFailure).length,
      plannedReps,
      completionPercent,
      sets: loggedSets.length,
      totalTime: completedWorkout.finishedAt
        ? Math.max(0, Math.floor((new Date(completedWorkout.finishedAt).getTime() - new Date(completedWorkout.createdAt).getTime()) / 1000))
        : totalTime,
      volume: loggedSets.reduce(/* EN: Totals training volume as weight multiplied by repetitions. UK: Підсумовує обсяг тренування як вагу, помножену на повторення. */ (sum, set) => sum + set.weight * set.reps, 0),
      programDraft: {
        description: '',
        exercises: plan.map(/* EN: Converts completed-plan exercises into a reusable program draft. UK: Перетворює вправи завершеного плану на чернетку програми для повторного використання. */ (item) => ({
          exerciseId: item.id,
          reps: Number(item.reps) || undefined,
          durationSeconds: Number(item.durationSeconds) || undefined,
          sets: Math.max(Number(item.sets) || 1, setsFor(item.id).length),
          week: 1,
          weekDay: 0,
          weight: Number(item.weight) || 0,
        })),
        name: `${title} ${t('copySuffix')}`,
      },
      plan: completedPlan,
      title: completedTitle,
    };
    setResult(nextResult);
    const id = completedWorkout.id || completedWorkoutId;
    navigation.replace('WorkoutCompleted', {
      date: isoDate(completedWorkout.finishedAt || new Date()),
      workoutRef: entityRef(completedTitle, id),
    });
  };

  /** EN: Clears completion state and returns to the root training plan. UK: Очищає стан завершення та повертає до кореневого плану тренувань. */
  const returnToTrainingPlan = () => {
    setResult(null);
    if (navigation.canGoBack()) navigation.popToTop();
    else navigation.navigate('TrainingHome');
  };

  /** EN: Checks for an equivalent saved program before deciding whether to offer creation. UK: Перевіряє наявність рівноцінної збереженої програми перед пропозицією створення. */
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

  /** EN: Leaves the result flow and opens Workshop in new-program mode. UK: Залишає підсумковий потік і відкриває Майстерню в режимі створення програми. */
  const createProgramFromResult = () => {
    setSavePromptOpen(false);
    const tabs = navigation.getParent();
    if (!tabs) {
      returnToTrainingPlan();
      return;
    }
    navigation.popToTop();
    tabs.navigate('Home', {
      screen: 'WorkshopHome',
      params: { createProgram: true },
    });
  };

  if (!activeWorkout && !plan.length) {
    return <SafeAreaView style={styles.safe}>
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t('noWorkoutSelected')}</Text>
        <Text style={styles.muted}>{t('selectWorkoutHint')}</Text>
        <Pressable onPress={/* EN: Returns from the empty state to the previous training screen. UK: Повертає з порожнього стану до попереднього екрана тренувань. */ () => navigation.goBack()}><Text style={styles.link}>{t('backToTrainingPlan')}</Text></Pressable>
      </View>
    </SafeAreaView>;
  }

  if (result) {
    const completion = result.completionPercent;
    const Metric = ({ icon: Icon, label, value, success = false }) => <View style={styles.resultMetricCard}>
      <Icon height={24} width={24} />
      <Text style={styles.resultMetricLabel}>{label}</Text>
      <Text style={[styles.resultMetricValue, success && styles.resultMetricSuccess]}>{value}</Text>
    </View>;
    return <SafeAreaView style={styles.resultSafe}>
      <ScrollView contentContainerStyle={styles.result} showsVerticalScrollIndicator={false}>
        <View style={styles.resultHeader}>
          <CompletionCheck height={24} width={24} />
          <Text style={styles.resultHeaderText}>{t('workoutComplete').toUpperCase()}</Text>
        </View>
        <View style={styles.resultLogo} pointerEvents="none"><LogoLeft style={styles.logoLeft} /><LogoTop style={styles.logoTop} /><LogoMiddle style={styles.logoMiddle} /></View>
        <Text style={styles.resultTitle}>{displayTitle}</Text>
        <View style={styles.resultMetricGrid}>
          <Metric icon={ActiveTimeIcon} label={t('activeTime')} value={formatTimer(result.elapsed)} />
          <Metric icon={TotalTimeIcon} label={t('totalTime')} value={formatTimer(result.totalTime)} />
          <Metric icon={ExercisesIcon} label={t('exercises')} value={result.exercises} />
          <Metric icon={SetsIcon} label={t('setsShort')} value={result.sets} />
          <Metric icon={VolumeIcon} label={t('volume')} value={`${Math.round(result.volume)} ${t('kilogramsShort')}`} />
          <Metric icon={PlanCompletionIcon} label={t('planCompletion')} success value={completion == null ? '—' : `${completion}%`} />
        </View>
        <View style={styles.resultMetricGrid}>
          <View style={[styles.resultMetricCard, styles.resultShortMetric]}>
            <Text style={styles.resultMetricLabel}>{t('averageRpe')}</Text>
            <Text style={styles.resultMetricValue}>{result.avgRpe ? result.avgRpe.toFixed(1) : '—'}</Text>
          </View>
          <View style={[styles.resultMetricCard, styles.resultShortMetric]}>
            <Text style={styles.resultMetricLabel}>{t('failureSets')}</Text>
            <Text style={styles.resultMetricValue}>
              {result.failure} <Text style={styles.resultMetricUnit}>{t('setsShort')}</Text>
            </Text>
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
        <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={/* EN: Returns to the previous route without mutating workout state. UK: Повертає до попереднього маршруту без зміни стану тренування. */ () => navigation.goBack()} style={styles.headerButton}>
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
        {plan.map(/* EN: Renders an interactive logging card for each planned exercise. UK: Відображає інтерактивну картку запису для кожної запланованої вправи. */ (item, index) => <ActiveExerciseCard
          compact={compact}
          expanded={expandedExerciseId === item.id}
          index={index}
          item={item}
          key={item.id}
          onDetails={setSelectedExercise}
          onDurationDraftChange={setDurationDraftState}
          onRemove={removeExercise}
          onSave={saveSet}
          onToggle={/* EN: Expands this exercise or collapses it when already open. UK: Розгортає цю вправу або згортає її, якщо вона вже відкрита. */ () => setExpandedExerciseId(/* EN: Toggles the captured exercise identifier against the current expansion. UK: Перемикає ідентифікатор вибраної вправи відносно поточного розгортання. */ (current) => current === item.id ? null : item.id)}
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
        disabled={!activeWorkout || pendingSaves > 0 || durationDraftExerciseIds.size > 0}
        onPress={/* EN: Opens finish confirmation after all set saves settle. UK: Відкриває підтвердження завершення після збереження всіх підходів. */ () => setFinishOpen(true)}
        style={[
          styles.finishButton,
          activeWorkout && pendingSaves === 0 && durationDraftExerciseIds.size === 0 && styles.finishActive,
          (!activeWorkout || pendingSaves > 0 || durationDraftExerciseIds.size > 0) && styles.finishDisabled,
        ]}
      >
        <Text style={[styles.finishText, (!activeWorkout || pendingSaves > 0 || durationDraftExerciseIds.size > 0) && styles.finishTextDisabled]}>{t('finish')}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={/* EN: Confirms cancellation for an active workout or discards preparation immediately. UK: Запитує підтвердження для активного тренування або одразу скидає підготовку. */ () => {
          if (activeWorkout) setCancelOpen(true);
          else { clearPreparedWorkout(); returnToTrainingPlan(); }
        }}
        style={styles.cancelButton}
      >
        <Text style={styles.cancelText}>{t('cancelWorkout').replace('?', '')}</Text>
      </Pressable>
    </ScrollView>

    <ExerciseDetailsModal exercise={selectedExercise} onClose={/* EN: Closes exercise details and clears their selection. UK: Закриває деталі вправи та очищає її вибір. */ () => setSelectedExercise(null)} visible={!!selectedExercise} />
    <ConfirmDialog
      cancelLabel={t('keepTraining')}
      confirmLabel={t('finish')}
      message={isPlanComplete ? t('finishSaveMessage') : incompleteMessage}
      onCancel={/* EN: Dismisses finish confirmation and continues the workout. UK: Закриває підтвердження завершення та продовжує тренування. */ () => setFinishOpen(false)}
      onConfirm={finish}
      title={t('finishWorkout')}
      visible={finishOpen}
    />
    <ConfirmDialog
      cancelLabel={t('keepWorkout')}
      confirmLabel={t('cancelWorkout').replace('?', '')}
      message={t('cancelWorkoutMessage')}
      onCancel={/* EN: Dismisses cancellation and keeps the workout active. UK: Закриває скасування та залишає тренування активним. */ () => setCancelOpen(false)}
      onConfirm={/* EN: Cancels the workout on the server, closes the dialog, and returns to training. UK: Скасовує тренування на сервері, закриває діалог і повертає до тренувань. */ async () => { await cancelWorkout(); setCancelOpen(false); returnToTrainingPlan(); }}
      title={t('cancelWorkout')}
      visible={cancelOpen}
    />
  </SafeAreaView>;
}
