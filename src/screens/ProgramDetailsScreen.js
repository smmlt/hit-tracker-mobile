import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './ProgramDetailsScreen.styles.js';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import { WorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { apiFetch, apiRequest } from '../services/api';
import { ConfirmDialog } from '../components/feedback';
import { ProgramDetailsContent } from './LibraryProgramScreen';
import { programExercises } from '../utils/library';
import { scheduleCardTone } from '../utils/scheduleCard';
import { palette } from '../constants/colors';

export default function ProgramDetailsScreen({ navigation, route }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { assignment } = route.params;
  const { userToken } = useContext(AuthContext);
  const { prepareWorkout, activeWorkout } = useContext(WorkoutContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProgram(await apiRequest(`/workout-programs/${assignment.programId}`, {}, userToken));
      setError(null);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [assignment.programId, t, userToken]);

  useEffect(() => { load(); }, [load]);

  const beginWorkout = () => {
    if (activeWorkout) { navigation.navigate('WorkoutSession'); return; }
    prepareWorkout({
      title: program.name,
      scheduleId: assignment.id,
      programId: program.id,
      exercises: programExercises(program),
    });
    navigation.navigate('WorkoutSession');
  };

  const openExercise = (item) => {
    navigation.push('ExerciseDetails', { exerciseId: item.id });
  };
  const tone = scheduleCardTone(assignment);
  const statusColor = {
    planned: palette.accent,
    completed: palette.greenBright,
    missed: palette.orange,
    completedLate: palette.grayLegacy,
  }[tone];
  const statusLabel = tone === 'completedLate'
    ? `${t('scheduleStatus_completed')} ${new Date(assignment.completedAt).toLocaleDateString(localeTag, { day: 'numeric', month: 'long' })}`
    : t(`scheduleStatus_${assignment.status}`);

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
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}>
          {!!error && <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>}
          {program && <>
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
