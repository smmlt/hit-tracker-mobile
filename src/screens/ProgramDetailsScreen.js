import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ExerciseDetailsModal } from '../components/exercise/ExerciseDetailsModal';
import { AuthContext } from '../context/AuthContext';
import { WorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { apiFetch } from '../services/api';
import { ConfirmDialog } from '../components/feedback';

const dayNames = {
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  uk: ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота', 'Неділя'],
};

export default function ProgramDetailsScreen({ navigation, route }) {
  const { assignment } = route.params;
  const { userToken } = useContext(AuthContext);
  const { startWorkout } = useContext(WorkoutContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const [program, setProgram] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [programResponse, exercisesResponse] = await Promise.all([
      apiFetch(`/workout-programs/${assignment.programId}`, {}, userToken),
      apiFetch('/exercises', {}, userToken),
    ]);
    if (programResponse.ok) {
      setProgram(programResponse.data);
      setExercises(exercisesResponse.ok ? exercisesResponse.data : []);
      setError(null);
    } else {
      setError(programResponse.data?.message || t('programLoadError'));
    }
    setLoading(false);
  }, [assignment.programId, t, userToken]);

  useEffect(() => { load(); }, [load]);

  const beginWorkout = async () => {
    const workout = await startWorkout(program.name, assignment.id);
    if (workout) navigation.navigate('WorkoutSession');
  };

  const openExercise = (item) => {
    const details = exercises.find((exercise) => exercise.id === item.exercise.id);
    setSelectedExercise(details || item.exercise);
  };

  const removeFromPlan = async () => {
    setRemoving(true);
    const response = await apiFetch(`/workout-programs/schedule/${assignment.id}`, { method: 'DELETE' }, userToken);
    setRemoving(false);
    if (response.ok) navigation.goBack();
    else setError(response.data?.message || t('scheduleLoadError'));
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => navigation.goBack()}><Text style={[styles.back, { color: theme.primary }]}>← {t('back')}</Text></Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('programDetails')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? <ActivityIndicator color={theme.primary} style={styles.loader} /> : (
        <ScrollView contentContainerStyle={styles.content}>
          {!!error && <Text style={{ color: theme.error }}>{error}</Text>}
          {program && <>
            <Pressable disabled={removing} onPress={() => setRemoveOpen(true)} style={[styles.removeButton, { borderColor: theme.error }]}>
              <Text style={[styles.removeText, { color: theme.error }]}>{removing ? '…' : t('removeFromPlan')}</Text>
            </Pressable>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{program.name}</Text>
            {!!program.description && <Text style={[styles.description, { color: theme.textSecondary }]}>{program.description}</Text>}
            <View style={styles.scheduleInfo}>
              <Text style={[styles.date, { color: theme.primary }]}>{t('scheduledFor')}: {assignment.scheduledFor}</Text>
              <View style={[styles.status, styles[`status_${assignment.status}`]]}>
                <Text style={styles.statusText}>{t(`scheduleStatus_${assignment.status}`)}</Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('exercises')}</Text>
            {program.schedule.map((item, index) => (
              <Pressable key={`${item.contentId}-${item.exercise?.id}-${index}`} onPress={() => openExercise(item)} style={[styles.exerciseCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <Text style={[styles.exerciseName, { color: theme.textPrimary }]}>{item.exercise?.name}</Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {t('week')} {item.week} · {dayNames[locale][item.weekDay]}
                </Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {item.setsCount} {t('setsShort')} · {item.targetReps || '—'} {t('repsShort')} · {item.plannedWeight || 0} {t('kilogramsShort')}
                </Text>
              </Pressable>
            ))}

            <Pressable onPress={beginWorkout} style={[styles.startButton, { backgroundColor: theme.primary }]}>
              <Text style={styles.startText}>{assignment.status === 'completed' ? t('trainAgain') : t('startWorkout')}</Text>
            </Pressable>
          </>}
        </ScrollView>
      )}

      <ExerciseDetailsModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
        visible={!!selectedExercise}
      />
      <ConfirmDialog
        visible={removeOpen}
        title={t('removePlanTitle')}
        message={t('removePlanMessage')}
        cancelLabel={t('cancel')}
        confirmLabel={t('remove')}
        onCancel={() => setRemoveOpen(false)}
        onConfirm={removeFromPlan}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  back: { fontSize: 15, fontWeight: '800' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSpacer: { width: 56 },
  loader: { marginTop: 48 },
  content: { gap: 12, padding: 18, paddingBottom: 80 },
  title: { fontSize: 28, fontWeight: '900' },
  removeButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  removeText: { fontSize: 12, fontWeight: '900' },
  description: { fontSize: 14, lineHeight: 21 },
  date: { fontSize: 13, fontWeight: '800' },
  scheduleInfo: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  status: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  status_planned: { backgroundColor: '#1D4ED8' },
  status_completed: { backgroundColor: '#15803D' },
  status_missed: { backgroundColor: '#991B1B' },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  sectionTitle: { fontSize: 19, fontWeight: '800', marginTop: 8 },
  exerciseCard: { borderRadius: 14, borderWidth: 1, gap: 5, padding: 14 },
  exerciseName: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 13 },
  startButton: { alignItems: 'center', borderRadius: 12, marginTop: 8, padding: 14 },
  startText: { color: '#fff', fontWeight: '900' },
});
