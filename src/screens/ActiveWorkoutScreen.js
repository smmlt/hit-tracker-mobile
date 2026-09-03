import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ExerciseDetailsModal } from '../components/exercise/ExerciseDetailsModal';
import { ConfirmDialog } from '../components/feedback';
import { AuthContext } from '../context/AuthContext';
import { WorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { apiFetch } from '../services/api';
import { formatTimer } from '../utils/formatters';
import { programExercises as fromProgram } from '../utils/library';

const activeSeconds = (workout, now) => {
  if (!workout?.createdAt) return 0;
  const total = Math.max(0, Math.floor((now - new Date(workout.createdAt).getTime()) / 1000));
  const currentPause = workout.status === 'paused' && workout.pausedAt
    ? Math.max(0, Math.floor((now - new Date(workout.pausedAt).getTime()) / 1000)) : 0;
  return Math.max(0, total - (workout.pausedSeconds || 0) - currentPause);
};

function ExerciseCard({ item, index, sets, onLog, onDetails, onRemove, disabled, theme }) {
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
      <View style={styles.cardText}><Text style={[styles.exerciseName, { color: theme.textPrimary }]}>{index + 1}. {item.name}</Text><Text style={[styles.progress, { color: complete ? '#22C55E' : theme.textSecondary }]}>{sets.length}/{planned} {complete ? 'Plan complete' : 'sets'}</Text></View>
      <Text style={[styles.chevron, { color: theme.primary }]}>{open ? '⌃' : '⌄'}</Text>
    </Pressable>
    <Text style={[styles.planText, { color: theme.textSecondary }]}>Plan: {planned} × {item.reps || '—'}</Text>
    {open && <View style={styles.cardBody}>
      <Pressable onPress={() => onDetails(item.exercise || item)}><Text style={[styles.link, { color: theme.primary }]}>View exercise details</Text></Pressable>
      {sets.map((set, setIndex) => <View key={set.id || setIndex} style={[styles.logged, { borderColor: theme.border }]}><Text style={{ color: theme.textPrimary }}>Set {setIndex + 1}</Text><Text style={{ color: theme.textSecondary }}>{set.weight} kg × {set.reps}{set.rpe ? ` · RPE ${set.rpe}` : ''}{set.isFailure ? ' · failure' : ''}</Text></View>)}
      {Array.from({ length: Math.max(0, planned + extraSets - sets.length) }).map((_, missingIndex) => <View key={`${item.id}-${missingIndex}-${sets.length}`} style={[styles.editor, { borderColor: theme.border }]}><Text style={[styles.setNumber, { color: theme.textSecondary }]}>Set {sets.length + missingIndex + 1}</Text><View style={styles.metrics}><TextInput value={draft.weight} onChangeText={(value) => change('weight', value)} editable={!disabled} keyboardType="decimal-pad" placeholder="kg" placeholderTextColor={theme.textSecondary} style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} /><TextInput value={draft.reps} onChangeText={(value) => change('reps', value)} editable={!disabled} keyboardType="number-pad" placeholder="reps" placeholderTextColor={theme.textSecondary} style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} /><TextInput value={draft.rpe} onChangeText={(value) => change('rpe', value)} editable={!disabled} keyboardType="number-pad" placeholder="RPE" placeholderTextColor={theme.textSecondary} style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} /></View><View style={styles.failureRow}><Text style={[styles.failureLabel, { color: theme.textSecondary }]}>To failure</Text><Switch value={draft.failure} onValueChange={(value) => change('failure', value)} disabled={disabled} trackColor={{ false: theme.border, true: theme.primary }} /><Pressable disabled={disabled} onPress={log} style={[styles.log, { backgroundColor: theme.primary }, disabled && styles.dim]}><Text style={styles.actionText}>Log set</Text></Pressable></View></View>)}
      <Pressable disabled={disabled} onPress={() => setExtraSets((value) => value + 1)} style={styles.smallAction}><Text style={[styles.link, { color: theme.primary }]}>+ Add extra set</Text></Pressable>
      <Pressable disabled={disabled} onPress={() => onRemove(item.id)} style={styles.smallAction}><Text style={{ color: theme.error, fontWeight: '800' }}>Remove exercise</Text></Pressable>
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
  const title = result ? finishedTitle : preparedWorkout?.title || activeWorkout?.type || route.params?.program?.name || 'Workout';
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

  if (!activeWorkout && !plan.length) return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><View style={styles.empty}><Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No workout selected</Text><Text style={{ color: theme.textSecondary }}>Open a planned program to prepare a workout.</Text><Pressable onPress={() => navigation.goBack()}><Text style={[styles.link, { color: theme.primary }]}>Back to training plan</Text></Pressable></View></SafeAreaView>;
  if (result) return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><ScrollView contentContainerStyle={styles.result}><Text style={[styles.eyebrow, { color: theme.primary }]}>WORKOUT COMPLETE</Text><Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text><View style={[styles.resultCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>{[['Active time', formatTimer(result.elapsed)], ['Total time', formatTimer(result.totalTime)], ['Exercises', String(result.exercises)], ['Sets', `${result.sets}/${plannedSets}`], ['Plan completion', plannedSets ? `${Math.min(100, Math.round(result.sets / plannedSets * 100))}%` : '—'], ['Volume', `${Math.round(result.volume)} kg`], ['Average RPE', result.avgRpe ? result.avgRpe.toFixed(1) : '—'], ['Failure sets', String(result.failure)]].map(([label, value]) => <View key={label} style={styles.resultRow}><Text style={{ color: theme.textSecondary }}>{label}</Text><Text style={{ color: theme.textPrimary, fontWeight: '800' }}>{value}</Text></View>)}</View><Pressable onPress={() => { setSaveName(`${title} copy`); setSaveOpen(true); }} style={[styles.secondary, { borderColor: theme.primary }]}><Text style={{ color: theme.primary, fontWeight: '800' }}>Save as my program</Text></Pressable><Pressable onPress={() => navigation.navigate('TrainingHome')} style={[styles.primary, { backgroundColor: theme.primary }]}><Text style={styles.actionText}>Back to training plan</Text></Pressable></ScrollView><Modal visible={saveOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSaveOpen(false)}><SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><View style={styles.saveForm}><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Save personal program</Text><Text style={{ color: theme.textSecondary }}>This creates a private copy; the original program is unchanged.</Text><TextInput value={saveName} onChangeText={setSaveName} placeholder="Program name" placeholderTextColor={theme.textSecondary} style={[styles.notes, { borderColor: theme.border, color: theme.textPrimary, minHeight: 46 }]} /><TextInput value={saveDescription} onChangeText={setSaveDescription} placeholder="Description (optional)" placeholderTextColor={theme.textSecondary} multiline style={[styles.notes, { borderColor: theme.border, color: theme.textPrimary }]} /><View style={styles.actions}><Pressable onPress={() => setSaveOpen(false)} style={[styles.secondary, { borderColor: theme.border }]}><Text style={{ color: theme.textPrimary }}>Cancel</Text></Pressable><Pressable onPress={saveAsPersonalProgram} disabled={savingProgram || !saveName.trim()} style={[styles.primary, { backgroundColor: theme.primary }, (!saveName.trim() || savingProgram) && styles.dim]}><Text style={styles.actionText}>{savingProgram ? 'Saving…' : 'Save'}</Text></Pressable></View></View></SafeAreaView></Modal></SafeAreaView>;

  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><View style={[styles.topbar, { borderBottomColor: theme.border }]}><Pressable onPress={() => navigation.goBack()}><Text style={[styles.link, { color: theme.primary }]}>← {t('back')}</Text></Pressable><Text style={[styles.status, { color: paused ? '#F59E0B' : activeWorkout ? '#22C55E' : theme.primary }]}>{paused ? 'PAUSED' : activeWorkout ? 'ACTIVE' : 'PREPARED'}</Text></View><ScrollView contentContainerStyle={styles.content}><Text style={[styles.eyebrow, { color: theme.primary }]}>ACTIVE WORKOUT</Text><Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>{activeWorkout ? <View style={[styles.timer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}><Text style={[styles.timerValue, { color: theme.textPrimary }]}>{formatTimer(elapsed)}</Text><Text style={{ color: theme.textSecondary }}>{paused ? 'Paused · active time' : 'Active time'}</Text></View> : <View style={[styles.ready, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}><Text style={[styles.readyTitle, { color: theme.textPrimary }]}>Your workout is ready</Text><Text style={{ color: theme.textSecondary }}>Edit the exercise list before you start. Starting creates a real workout session.</Text></View>}<View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Exercises ({plan.length})</Text><Pressable onPress={() => setPickerOpen(true)} disabled={paused}><Text style={[styles.link, { color: theme.primary }]}>+ Add</Text></Pressable></View>{plan.map((item, index) => <ExerciseCard key={item.id} item={item} index={index} sets={setsFor(item.id)} onLog={logSet} onDetails={setSelectedExercise} onRemove={removeExercise} disabled={!activeWorkout || paused} theme={theme} />)}{activeWorkout && <TextInput value={notes} onChangeText={setNotes} placeholder="Workout notes" placeholderTextColor={theme.textSecondary} multiline style={[styles.notes, { borderColor: theme.border, color: theme.textPrimary }]} />}</ScrollView><View style={[styles.actions, { backgroundColor: theme.background, borderTopColor: theme.border }]}>{!activeWorkout ? <><Pressable onPress={() => { clearPreparedWorkout(); navigation.goBack(); }} style={[styles.secondary, { borderColor: theme.border }]}><Text style={{ color: theme.textPrimary }}>Cancel</Text></Pressable><Pressable onPress={begin} disabled={isLoading} style={[styles.primary, { backgroundColor: theme.primary }]}>{isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Start workout</Text>}</Pressable></> : <><Pressable onPress={() => setCancelOpen(true)} style={[styles.secondary, { borderColor: theme.error }]}><Text style={{ color: theme.error }}>Cancel</Text></Pressable><Pressable onPress={togglePauseWorkout} style={[styles.secondary, { borderColor: theme.border }]}><Text style={{ color: theme.textPrimary }}>{paused ? 'Resume' : 'Pause'}</Text></Pressable><Pressable onPress={() => setFinishOpen(true)} style={[styles.primary, { backgroundColor: theme.primary }]}><Text style={styles.actionText}>Finish</Text></Pressable></>}</View><Modal visible={pickerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPickerOpen(false)}><SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><View style={[styles.topbar, { borderBottomColor: theme.border }]}><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Add exercise</Text><Pressable onPress={() => setPickerOpen(false)}><Text style={[styles.link, { color: theme.primary }]}>Close</Text></Pressable></View><ScrollView contentContainerStyle={styles.content}>{catalog.map((exercise) => <Pressable key={exercise.id} onPress={() => addExercise(exercise)} style={[styles.catalogItem, { borderColor: theme.border }]}><Text style={[styles.exerciseName, { color: theme.textPrimary }]}>{exercise.name}</Text><Text style={{ color: theme.textSecondary }} numberOfLines={2}>{exercise.description || 'No description'}</Text></Pressable>)}</ScrollView></SafeAreaView></Modal><ExerciseDetailsModal exercise={selectedExercise} visible={!!selectedExercise} onClose={() => setSelectedExercise(null)} /><ConfirmDialog visible={finishOpen} title="Finish workout?" message={loggedSets.length < plannedSets ? `You logged ${loggedSets.length} of ${plannedSets} planned sets. You can still finish now.` : 'Your workout will be saved to history.'} cancelLabel="Keep training" confirmLabel="Finish" onCancel={() => setFinishOpen(false)} onConfirm={finish} /><ConfirmDialog visible={cancelOpen} title="Cancel workout?" message="Logged sets will not appear in completed history. Your program stays in the calendar." cancelLabel="Keep workout" confirmLabel="Cancel workout" onCancel={() => setCancelOpen(false)} onConfirm={async () => { await cancelWorkout(); setCancelOpen(false); navigation.goBack(); }} /></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, topbar: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 16 }, content: { gap: 14, padding: 18, paddingBottom: 110 }, eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 }, title: { fontSize: 28, fontWeight: '900' }, status: { fontSize: 12, fontWeight: '900', letterSpacing: 1 }, timer: { alignItems: 'center', borderRadius: 16, borderWidth: 1, gap: 4, padding: 16 }, timerValue: { fontSize: 35, fontVariant: ['tabular-nums'], fontWeight: '900' }, ready: { borderRadius: 16, borderWidth: 1, gap: 6, padding: 16 }, readyTitle: { fontSize: 17, fontWeight: '800' }, sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }, sectionTitle: { fontSize: 18, fontWeight: '900' }, card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 14 }, cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, cardText: { flex: 1, gap: 4 }, exerciseName: { fontSize: 16, fontWeight: '800' }, progress: { fontSize: 12, fontWeight: '700' }, chevron: { fontSize: 24, marginLeft: 10 }, planText: { fontSize: 12, marginTop: 8 }, cardBody: { gap: 10, marginTop: 14 }, link: { fontSize: 14, fontWeight: '800' }, logged: { borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 }, editor: { borderTopWidth: 1, gap: 8, paddingTop: 12 }, setNumber: { fontSize: 12, fontWeight: '800' }, metrics: { flexDirection: 'row', gap: 8 }, input: { borderRadius: 8, borderWidth: 1, flex: 1, fontSize: 14, padding: 9, textAlign: 'center' }, failureRow: { alignItems: 'center', flexDirection: 'row', gap: 8 }, failureLabel: { flex: 1, fontSize: 12 }, log: { borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9 }, actionText: { color: '#fff', fontSize: 13, fontWeight: '900' }, smallAction: { alignItems: 'center', padding: 8 }, notes: { borderRadius: 12, borderWidth: 1, minHeight: 82, padding: 12, textAlignVertical: 'top' }, actions: { borderTopWidth: 1, flexDirection: 'row', gap: 8, padding: 14 }, primary: { alignItems: 'center', borderRadius: 11, flex: 1, justifyContent: 'center', minHeight: 46, paddingHorizontal: 12 }, secondary: { alignItems: 'center', borderRadius: 11, borderWidth: 1, justifyContent: 'center', minHeight: 46, paddingHorizontal: 12 }, dim: { opacity: 0.5 }, empty: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center', padding: 28 }, emptyTitle: { fontSize: 22, fontWeight: '900' }, catalogItem: { borderBottomWidth: 1, gap: 5, paddingVertical: 14 }, result: { gap: 16, padding: 22 }, resultCard: { borderRadius: 16, borderWidth: 1, gap: 13, padding: 16 }, resultRow: { flexDirection: 'row', justifyContent: 'space-between' }, saveForm: { gap: 14, padding: 20 } });
