import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { styles } from './ActiveWorkoutScreen.styles.js';
import { ExerciseDetailsModal } from '../components/exercise/ExerciseDetailsModal';
import { ConfirmDialog } from '../components/feedback';
import { AuthContext } from '../context/AuthContext';
import { WorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { apiFetch } from '../services/api';
import { formatTimer } from '../utils/formatters';
import { programExercises as fromProgram } from '../utils/library';

import { palette } from '../constants/colors';
const activeSeconds = (workout, now) => {
  if (!workout?.createdAt) return 0;
  const total = Math.max(0, Math.floor((now - new Date(workout.createdAt).getTime()) / 1000));
  const currentPause = workout.status === 'paused' && workout.pausedAt
    ? Math.max(0, Math.floor((now - new Date(workout.pausedAt).getTime()) / 1000)) : 0;
  return Math.max(0, total - (workout.pausedSeconds || 0) - currentPause);
};

function ExerciseCard({ item, index, sets, onLog, onDetails, onRemove, disabled, theme, t }) {
  const [open, setOpen] = useState(false);
  const [extraSets, setExtraSets] = useState(0);
  const [draft, setDraft] = useState({ weight: '', reps: String(item.reps || ''), rpe: '', failure: false });
  const planned = Number(item.sets) || 0;
  const complete = sets.length >= planned;
  const change = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const log = async () => {
    if (await onLog(item, draft)) setDraft((current) => ({ ...current, rpe: '', failure: false }));
  };
  return <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
    <Pressable onPress={() => setOpen((value) => !value)} style={styles.cardHeader}>
      <View style={styles.cardText}><Text style={[styles.exerciseName, { color: theme.textPrimary }]}>{index + 1}. {item.name}</Text><Text style={[styles.progress, { color: complete ? palette.greenBright : theme.textSecondary }]}>{sets.length}/{planned} {complete ? t('planComplete') : t('setsShort')}</Text></View>
      <Text style={[styles.chevron, { color: theme.primary }]}>{open ? '⌃' : '⌄'}</Text>
    </Pressable>
    <Text style={[styles.planText, { color: theme.textSecondary }]}>{t('plan')}: {planned} × {item.reps || '—'}</Text>
    {open && <View style={styles.cardBody}>
      <Pressable onPress={() => onDetails(item.exercise || item)}><Text style={[styles.link, { color: theme.primary }]}>{t('viewExerciseDetails')}</Text></Pressable>
      {sets.map((set, setIndex) => <View key={set.id || setIndex} style={[styles.logged, { borderColor: theme.border }]}><Text style={{ color: theme.textPrimary }}>{t('setNumber', { number: setIndex + 1 })}</Text><Text style={{ color: theme.textSecondary }}>{set.weight} {t('kilogramsShort')} × {set.reps}{set.rpe ? ` · RPE ${set.rpe}` : ''}{set.isFailure ? ` · ${t('failure').toLowerCase()}` : ''}</Text></View>)}
      {Array.from({ length: Math.max(0, planned + extraSets - sets.length) }).map((_, missingIndex) => <View key={`${item.id}-${missingIndex}-${sets.length}`} style={[styles.editor, { borderColor: theme.border }]}><Text style={[styles.setNumber, { color: theme.textSecondary }]}>{t('setNumber', { number: sets.length + missingIndex + 1 })}</Text><View style={styles.metrics}><TextInput value={draft.weight} onChangeText={(value) => change('weight', value)} editable={!disabled} keyboardType="decimal-pad" placeholder={t('kilogramsShort')} placeholderTextColor={theme.textSecondary} style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} /><TextInput value={draft.reps} onChangeText={(value) => change('reps', value)} editable={!disabled} keyboardType="number-pad" placeholder={t('repsShort')} placeholderTextColor={theme.textSecondary} style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} /><TextInput value={draft.rpe} onChangeText={(value) => change('rpe', value)} editable={!disabled} keyboardType="number-pad" placeholder="RPE" placeholderTextColor={theme.textSecondary} style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} /></View><View style={styles.failureRow}><Text style={[styles.failureLabel, { color: theme.textSecondary }]}>{t('toFailure')}</Text><Switch value={draft.failure} onValueChange={(value) => change('failure', value)} disabled={disabled} trackColor={{ false: theme.border, true: theme.primary }} /><Pressable disabled={disabled} onPress={log} style={[styles.log, { backgroundColor: theme.primary }, disabled && styles.dim]}><Text style={styles.actionText}>{t('logSet')}</Text></Pressable></View></View>)}
      <Pressable disabled={disabled} onPress={() => setExtraSets((value) => value + 1)} style={styles.smallAction}><Text style={[styles.link, { color: theme.primary }]}>+ {t('addExtraSet')}</Text></Pressable>
      <Pressable disabled={disabled} onPress={() => onRemove(item.id)} style={styles.smallAction}><Text style={{ color: theme.error, fontWeight: '800' }}>{t('removeExercise')}</Text></Pressable>
    </View>}
  </View>;
}

export default function ActiveWorkoutScreen({ navigation, route }) {
  const { userToken } = useContext(AuthContext);
  const { activeWorkout, loggedSets, setLoggedSets, preparedWorkout, prepareWorkout, clearPreparedWorkout, startWorkout, finishWorkout, cancelWorkout, togglePauseWorkout, isLoading } = useContext(WorkoutContext);
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const [finishedPlan, setFinishedPlan] = useState([]);
  const [finishedTitle, setFinishedTitle] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const plan = result ? finishedPlan : preparedWorkout?.exercises || [];
  const title = result ? finishedTitle : preparedWorkout?.title || activeWorkout?.type || route.params?.program?.name || t('workout');
  const setPlan = (change) => prepareWorkout((current) => ({ ...current, title: current?.title || title, exercises: typeof change === 'function' ? change(current?.exercises || []) : change }));
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [savingProgram, setSavingProgram] = useState(false);
  const [now, setNow] = useState(Date.now());
  const scheduleId = preparedWorkout?.scheduleId || route.params?.assignment?.id;
  useEffect(() => { if (preparedWorkout && result) setResult(null); }, [preparedWorkout]);

  useEffect(() => { apiFetch('/exercises', {}, userToken).then((res) => setCatalog(res.ok ? res.data : [])); }, [userToken]);
  useEffect(() => {
    if (!activeWorkout?.programId || plan.length) return;
    apiFetch(`/workout-programs/${activeWorkout.programId}`, {}, userToken).then((res) => {
      if (res.ok) {
        prepareWorkout((current) => current?.exercises?.length ? current : { title: res.data.name, exercises: fromProgram(res.data) });
      }
    });
  }, [activeWorkout?.programId, plan.length, userToken]);
  useEffect(() => {
    if (route.params?.program && !preparedWorkout && !result) prepareWorkout({ title: route.params.program.name, exercises: fromProgram(route.params.program) });
  }, [route.params?.program, preparedWorkout, result]);
  useEffect(() => { if (!activeWorkout || activeWorkout.status === 'paused') return undefined; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [activeWorkout]);

  const paused = activeWorkout?.status === 'paused';
  const elapsed = activeSeconds(activeWorkout, now);
  const totalTime = activeWorkout ? Math.max(0, Math.floor((now - new Date(activeWorkout.createdAt).getTime()) / 1000)) : 0;
  const setsFor = useCallback((exerciseId) => loggedSets.filter((set) => set.exerciseId === exerciseId), [loggedSets]);
  const plannedSets = useMemo(() => plan.reduce((total, item) => total + (Number(item.sets) || 0), 0), [plan]);
  const begin = () => startWorkout(title, scheduleId);
  const logSet = async (item, draft) => {
    if (!activeWorkout || paused || !draft.weight || !draft.reps) return false;
    const response = await apiFetch(`/workouts/${activeWorkout.id}/sets`, { method: 'POST', body: JSON.stringify({ exerciseId: item.id, weight: Number(draft.weight), reps: Number(draft.reps), rpe: draft.rpe ? Number(draft.rpe) : undefined, isFailure: draft.failure }) }, userToken);
    if (!response.ok || !response.data?.set) return false;
    setLoggedSets((current) => [...current, { ...response.data.set, exerciseName: item.name }]);
    return true;
  };
  const finish = async () => {
    setFinishedPlan(plan);
    setFinishedTitle(title);
    if (!await finishWorkout(notes, elapsed)) return;
    setFinishOpen(false);
    const rpeSets = loggedSets.filter((set) => set.rpe);
    setResult({ sets: loggedSets.length, exercises: new Set(loggedSets.map((set) => set.exerciseId)).size, volume: loggedSets.reduce((sum, set) => sum + set.weight * set.reps, 0), avgRpe: rpeSets.reduce((sum, set) => sum + set.rpe, 0) / (rpeSets.length || 1), failure: loggedSets.filter((set) => set.isFailure).length, elapsed, totalTime });
  };
  const addExercise = (exercise) => { if (!plan.some((item) => item.id === exercise.id)) setPlan((current) => [...current, { id: exercise.id, name: exercise.name, exercise, sets: 3, reps: 10, weight: 0 }]); setPickerOpen(false); };
  const removeExercise = (id) => setPlan((current) => current.filter((item) => item.id !== id));
  const saveAsPersonalProgram = async () => {
    if (!saveName.trim() || !plan.length) return;
    setSavingProgram(true);
    const response = await apiFetch('/workout-programs', { method: 'POST', body: JSON.stringify({
      name: saveName.trim(), description: saveDescription.trim() || undefined,
      exercises: plan.map((item) => ({ exerciseId: item.id, sets: Math.max(Number(item.sets) || 1, setsFor(item.id).length), reps: Number(item.reps) || undefined, weight: Number(item.weight) || 0, weekDay: 0 })),
    }) }, userToken);
    setSavingProgram(false);
    if (response.ok) setSaveOpen(false);
  };

  if (!activeWorkout && !plan.length) return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><View style={styles.empty}><Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{t('noWorkoutSelected')}</Text><Text style={{ color: theme.textSecondary }}>{t('selectWorkoutHint')}</Text><Pressable onPress={() => navigation.goBack()}><Text style={[styles.link, { color: theme.primary }]}>{t('backToTrainingPlan')}</Text></Pressable></View></SafeAreaView>;
  if (result) return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><ScrollView contentContainerStyle={styles.result}><Text style={[styles.eyebrow, { color: theme.primary }]}>{t('workoutComplete').toUpperCase()}</Text><Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text><View style={[styles.resultCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>{[[t('activeTime'), formatTimer(result.elapsed)], [t('totalTime'), formatTimer(result.totalTime)], [t('exercises'), String(result.exercises)], [t('setsShort'), `${result.sets}/${plannedSets}`], [t('planCompletion'), plannedSets ? `${Math.min(100, Math.round(result.sets / plannedSets * 100))}%` : '—'], [t('volume'), `${Math.round(result.volume)} ${t('kilogramsShort')}`], [t('averageRpe'), result.avgRpe ? result.avgRpe.toFixed(1) : '—'], [t('failureSets'), String(result.failure)]].map(([label, value]) => <View key={label} style={styles.resultRow}><Text style={{ color: theme.textSecondary }}>{label}</Text><Text style={{ color: theme.textPrimary, fontWeight: '800' }}>{value}</Text></View>)}</View><Pressable onPress={() => { setSaveName(`${title} ${t('copySuffix')}`); setSaveOpen(true); }} style={[styles.secondary, { borderColor: theme.primary }]}><Text style={{ color: theme.primary, fontWeight: '800' }}>{t('saveAsProgram')}</Text></Pressable><Pressable onPress={() => navigation.navigate('TrainingHome')} style={[styles.primary, { backgroundColor: theme.primary }]}><Text style={styles.actionText}>{t('backToTrainingPlan')}</Text></Pressable></ScrollView><Modal visible={saveOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSaveOpen(false)}><SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><View style={styles.saveForm}><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('savePersonalProgram')}</Text><Text style={{ color: theme.textSecondary }}>{t('personalCopyHint')}</Text><TextInput value={saveName} onChangeText={setSaveName} placeholder={t('programName')} placeholderTextColor={theme.textSecondary} style={[styles.notes, { borderColor: theme.border, color: theme.textPrimary, minHeight: 46 }]} /><TextInput value={saveDescription} onChangeText={setSaveDescription} placeholder={t('descriptionOptional')} placeholderTextColor={theme.textSecondary} multiline style={[styles.notes, { borderColor: theme.border, color: theme.textPrimary }]} /><View style={styles.actions}><Pressable onPress={() => setSaveOpen(false)} style={[styles.secondary, { borderColor: theme.border }]}><Text style={{ color: theme.textPrimary }}>{t('cancel')}</Text></Pressable><Pressable onPress={saveAsPersonalProgram} disabled={savingProgram || !saveName.trim()} style={[styles.primary, { backgroundColor: theme.primary }, (!saveName.trim() || savingProgram) && styles.dim]}><Text style={styles.actionText}>{savingProgram ? t('saving') : t('save')}</Text></Pressable></View></View></SafeAreaView></Modal></SafeAreaView>;

  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><View style={[styles.topbar, { borderBottomColor: theme.border }]}><Pressable onPress={() => navigation.goBack()}><Text style={[styles.link, { color: theme.primary }]}>← {t('back')}</Text></Pressable><Text style={[styles.status, { color: paused ? palette.amber : activeWorkout ? palette.greenBright : theme.primary }]}>{paused ? t('paused').toUpperCase() : activeWorkout ? t('active').toUpperCase() : t('prepared').toUpperCase()}</Text></View><ScrollView contentContainerStyle={styles.content}><Text style={[styles.eyebrow, { color: theme.primary }]}>{t('activeWorkout').toUpperCase()}</Text><Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>{activeWorkout ? <View style={[styles.timer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}><Text style={[styles.timerValue, { color: theme.textPrimary }]}>{formatTimer(elapsed)}</Text><Text style={{ color: theme.textSecondary }}>{paused ? t('pausedActiveTime') : t('activeTime')}</Text></View> : <View style={[styles.ready, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}><Text style={[styles.readyTitle, { color: theme.textPrimary }]}>{t('workoutReady')}</Text><Text style={{ color: theme.textSecondary }}>{t('workoutReadyHint')}</Text></View>}<View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('exercises')} ({plan.length})</Text><Pressable onPress={() => setPickerOpen(true)} disabled={paused}><Text style={[styles.link, { color: theme.primary }]}>+ {t('add')}</Text></Pressable></View>{plan.map((item, index) => <ExerciseCard key={item.id} item={item} index={index} sets={setsFor(item.id)} onLog={logSet} onDetails={setSelectedExercise} onRemove={removeExercise} disabled={!activeWorkout || paused} theme={theme} t={t} />)}{activeWorkout && <TextInput value={notes} onChangeText={setNotes} placeholder={t('workoutNotes')} placeholderTextColor={theme.textSecondary} multiline style={[styles.notes, { borderColor: theme.border, color: theme.textPrimary }]} />}</ScrollView><View style={[styles.actions, { backgroundColor: theme.background, borderTopColor: theme.border }]}>{!activeWorkout ? <><Pressable onPress={() => { clearPreparedWorkout(); navigation.goBack(); }} style={[styles.secondary, { borderColor: theme.border }]}><Text style={{ color: theme.textPrimary }}>{t('cancel')}</Text></Pressable><Pressable onPress={begin} disabled={isLoading} style={[styles.primary, { backgroundColor: theme.primary }]}>{isLoading ? <ActivityIndicator color={palette.whitePure} /> : <Text style={styles.actionText}>{t('startWorkout')}</Text>}</Pressable></> : <><Pressable onPress={() => setCancelOpen(true)} style={[styles.secondary, { borderColor: theme.error }]}><Text style={{ color: theme.error }}>{t('cancel')}</Text></Pressable><Pressable onPress={togglePauseWorkout} style={[styles.secondary, { borderColor: theme.border }]}><Text style={{ color: theme.textPrimary }}>{paused ? t('resume') : t('pause')}</Text></Pressable><Pressable onPress={() => setFinishOpen(true)} style={[styles.primary, { backgroundColor: theme.primary }]}><Text style={styles.actionText}>{t('finish')}</Text></Pressable></>}</View><Modal visible={pickerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPickerOpen(false)}><SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><View style={[styles.topbar, { borderBottomColor: theme.border }]}><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('addExercise')}</Text><Pressable onPress={() => setPickerOpen(false)}><Text style={[styles.link, { color: theme.primary }]}>{t('close')}</Text></Pressable></View><ScrollView contentContainerStyle={styles.content}>{catalog.map((exercise) => <Pressable key={exercise.id} onPress={() => addExercise(exercise)} style={[styles.catalogItem, { borderColor: theme.border }]}><Text style={[styles.exerciseName, { color: theme.textPrimary }]}>{exercise.name}</Text><Text style={{ color: theme.textSecondary }} numberOfLines={2}>{exercise.description || t('noDescription')}</Text></Pressable>)}</ScrollView></SafeAreaView></Modal><ExerciseDetailsModal exercise={selectedExercise} visible={!!selectedExercise} onClose={() => setSelectedExercise(null)} /><ConfirmDialog visible={finishOpen} title={t('finishWorkout')} message={loggedSets.length < plannedSets ? t('finishIncompleteMessage', { logged: loggedSets.length, planned: plannedSets }) : t('finishSaveMessage')} cancelLabel={t('keepTraining')} confirmLabel={t('finish')} onCancel={() => setFinishOpen(false)} onConfirm={finish} /><ConfirmDialog visible={cancelOpen} title={t('cancelWorkout')} message={t('cancelWorkoutMessage')} cancelLabel={t('keepWorkout')} confirmLabel={t('cancelWorkout').replace('?', '')} onCancel={() => setCancelOpen(false)} onConfirm={async () => { await cancelWorkout(); setCancelOpen(false); navigation.goBack(); }} /></SafeAreaView>;
}
