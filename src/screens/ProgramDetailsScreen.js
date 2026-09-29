import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './ProgramDetailsScreen.styles.js';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { apiFetch, apiRequest } from '../services/api';
import { ConfirmDialog } from '../components/feedback';
import { ProgramDetailsContent } from './LibraryProgramScreen';
import { programExercises } from '../utils/library';
import { scheduleCardTone } from '../utils/scheduleCard';
import { palette } from '../constants/colors';
import { entityId, entityRef } from '../utils/navigationPaths';

export default function ProgramDetailsScreen({ navigation, route }) {
  const tabBarHeight = useBottomTabBarHeight();
  const legacyAssignment = route.params?.assignment;
  const assignmentId = entityId(route.params?.assignmentRef) || legacyAssignment?.id;
  const scheduledFor = route.params?.date || legacyAssignment?.scheduledFor;
  const { userToken } = useContext(AuthContext);
  const { prepareWorkout, activeWorkout } = useWorkout(useShallow((state) => ({ prepareWorkout: state.prepareWorkout, activeWorkout: state.activeWorkout })));
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const [program, setProgram] = useState(null);
  const [assignment, setAssignment] = useState(legacyAssignment || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let current = legacyAssignment;
      if (!current && assignmentId && scheduledFor) {
        const rows = await apiRequest(`/workout-programs/schedule?from=${scheduledFor}&to=${scheduledFor}`, {}, userToken);
        current = (Array.isArray(rows) ? rows : []).find((item) => item.id === assignmentId);
      }
      if (!current) throw new Error(t('programLoadError'));
      setAssignment(current);
      setProgram(await apiRequest(`/workout-programs/${current.programId}`, {}, userToken));
      setError(null);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [assignmentId, legacyAssignment, scheduledFor, t, userToken]);

  useEffect(() => { load(); }, [load]);

  const beginWorkout = () => {
    if (activeWorkout) { navigation.navigate('WorkoutSession'); return; }
    prepareWorkout({
      title: program.name,
      scheduleId: assignment.id,
      programId: program.id,
      exercises: programExercises(program),
    });
    navigation.navigate('WorkoutPreparation');
  };

  const openExercise = (item) => {
    navigation.push('ExerciseDetails', { exerciseRef: entityRef(item.name, item.id) });
  };
  const tone = assignment ? scheduleCardTone(assignment) : 'planned';
  const statusColor = {
    planned: palette.accent,
    completed: palette.greenBright,
    missed: palette.orange,
    completedLate: palette.grayLegacy,
  }[tone];
  const statusLabel = tone === 'completedLate'
    ? `${t('scheduleStatus_completed')} ${new Date(assignment.completedAt).toLocaleDateString(localeTag, { day: 'numeric', month: 'long' })}`
    : t(`scheduleStatus_${assignment?.status || 'planned'}`);

  const removeFromPlan = async () => {
    if (!assignment) return;
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
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}>
          {!!error && <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>}
          {program && assignment && <>
            <Pressable disabled={removing} onPress={() => setRemoveOpen(true)} style={[styles.removeButton, { borderColor: theme.error }]}>
              <Text style={[styles.removeText, { color: theme.error }]}>{removing ? '…' : t('removeFromPlan')}</Text>
            </Pressable>
            <View style={styles.scheduleInfo}>
              <Text style={[styles.date, { color: theme.textSecondary }]}>{t('scheduledFor')}: {assignment.scheduledFor}</Text>
              <View style={[styles.status, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{statusLabel}</Text>
              </View>
            </View>

            <ProgramDetailsContent
              program={program}
              showProgramDifficulty
              onExercise={openExercise}
            />

            <Pressable onPress={beginWorkout} style={[styles.startButton, { backgroundColor: theme.primary }]}>
              <Text style={styles.startText}>{assignment.status === 'completed' ? t('trainAgain') : t('startWorkout')}</Text>
            </Pressable>
          </>}
        </ScrollView>
      )}

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
