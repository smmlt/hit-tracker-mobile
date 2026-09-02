import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../../services/api';

const request = async (endpoint, options, token) => {
  const response = await apiFetch(endpoint, options, token);
  if (!response.ok) throw new Error(response.data?.message || 'Request failed');
  return response.data;
};

export function ContentManagement({ userToken }) {
  const [tab, setTab] = useState('programs');
  const [exercises, setExercises] = useState([]);
  const [muscles, setMuscles] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [programExercises, setProgramExercises] = useState([]);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseDescription, setExerciseDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [difficulty, setDifficulty] = useState('1');
  const [muscleIds, setMuscleIds] = useState([]);
  const [message, setMessage] = useState(null);

  const load = async () => {
    try {
      const [loadedExercises, loadedMuscles, loadedPrograms] = await Promise.all([
        request('/exercises', {}, userToken),
        request('/exercises/muscles', {}, userToken),
        request('/workout-programs', {}, userToken),
      ]);
      setExercises(loadedExercises);
      setMuscles(loadedMuscles);
      setPrograms(loadedPrograms);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => { load(); }, [userToken]);

  const createProgram = async () => {
    try {
      await request('/workout-programs/official', {
        method: 'POST',
        body: JSON.stringify({ name: programName, description: programDescription || undefined, exercises: programExercises }),
      }, userToken);
      setProgramName('');
      setProgramDescription('');
      setProgramExercises([]);
      setMessage('Program created');
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const createExercise = async () => {
    try {
      await request('/exercises', {
        method: 'POST',
        body: JSON.stringify({
          name: exerciseName,
          description: exerciseDescription || undefined,
          videoUrl: videoUrl || undefined,
          difficulty: Number(difficulty),
          muscleIds,
        }),
      }, userToken);
      setExerciseName('');
      setExerciseDescription('');
      setVideoUrl('');
      setDifficulty('1');
      setMuscleIds([]);
      setMessage('Exercise created');
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const addExercise = (exercise) => setProgramExercises((items) => [
    ...items,
    { exerciseId: exercise.id, sets: 1, reps: 8, weight: 0, weekDay: 0 },
  ]);

  return (
    <View style={styles.card}>
      <View style={styles.tabs}>
        {['programs', 'exercises'].map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}>
            <Text style={styles.tabText}>{item === 'programs' ? 'Programs' : 'Exercises'}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'programs' ? (
        <>
          <Text style={styles.title}>Create official program</Text>
          <TextInput value={programName} onChangeText={setProgramName} placeholder="Program name" placeholderTextColor="#94a3b8" style={styles.input} />
          <TextInput value={programDescription} onChangeText={setProgramDescription} placeholder="Description" placeholderTextColor="#94a3b8" multiline style={[styles.input, styles.description]} />
          <Text style={styles.label}>Add exercises from the library</Text>
          <ScrollView horizontal contentContainerStyle={styles.exerciseChoices}>
            {exercises.map((exercise) => <Pressable key={exercise.id} style={styles.chip} onPress={() => addExercise(exercise)}><Text style={styles.chipText}>+ {exercise.name}</Text></Pressable>)}
          </ScrollView>
          {programExercises.map((item, index) => {
            const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
            return <View key={`${item.exerciseId}-${index}`} style={styles.row}>
              <Text style={styles.rowText}>{exercise?.name}</Text>
              <TextInput value={String(item.sets)} keyboardType="numeric" onChangeText={(value) => setProgramExercises((items) => items.map((entry, itemIndex) => itemIndex === index ? { ...entry, sets: Number(value) || 1 } : entry))} style={styles.smallInput} />
              <Text style={styles.smallLabel}>sets</Text>
              <Pressable onPress={() => setProgramExercises((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Text style={styles.remove}>Remove</Text></Pressable>
            </View>;
          })}
          <Pressable style={styles.primary} onPress={createProgram}><Text style={styles.primaryText}>Create program</Text></Pressable>
          <Text style={styles.label}>Programs</Text>
          {programs.map((program) => <View key={program.id} style={styles.programCard}>
            <Text style={styles.programBadge}>{program.isPersonal ? `Personal program · @${program.ownerUsername || 'user'}` : 'Official program'}</Text>
            <Text style={styles.rowText}>{program.name}</Text>
            {!!program.description && <Text style={styles.muted}>{program.description}</Text>}
          </View>)}
        </>
      ) : (
        <>
          <Text style={styles.title}>Create exercise</Text>
          <TextInput value={exerciseName} onChangeText={setExerciseName} placeholder="Exercise name" placeholderTextColor="#94a3b8" style={styles.input} />
          <TextInput value={exerciseDescription} onChangeText={setExerciseDescription} placeholder="Description and form tips" placeholderTextColor="#94a3b8" multiline style={[styles.input, styles.description]} />
          <TextInput value={videoUrl} onChangeText={setVideoUrl} placeholder="Video URL" placeholderTextColor="#94a3b8" style={styles.input} />
          <TextInput value={difficulty} onChangeText={setDifficulty} keyboardType="numeric" placeholder="Difficulty (1–5)" placeholderTextColor="#94a3b8" style={styles.input} />
          <Text style={styles.label}>Target muscles</Text>
          <View style={styles.exerciseChoices}>{muscles.map((muscle) => <Pressable key={muscle.id} onPress={() => setMuscleIds((ids) => ids.includes(muscle.id) ? ids.filter((id) => id !== muscle.id) : [...ids, muscle.id])} style={[styles.chip, muscleIds.includes(muscle.id) && styles.chipActive]}><Text style={styles.chipText}>{muscle.commonName}</Text></Pressable>)}</View>
          <Pressable style={styles.primary} onPress={createExercise}><Text style={styles.primaryText}>Create exercise</Text></Pressable>
        </>
      )}
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1e293b', borderRadius: 16, gap: 12, maxWidth: 1000, padding: 20 },
  tabs: { flexDirection: 'row', gap: 8 }, tab: { backgroundColor: '#334155', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }, tabActive: { backgroundColor: '#f97316' }, tabText: { color: '#fff', fontWeight: '700' },
  title: { color: '#f8fafc', fontSize: 20, fontWeight: '700' }, label: { color: '#cbd5e1', fontWeight: '600' }, muted: { color: '#94a3b8' },
  input: { backgroundColor: '#0f172a', borderRadius: 8, color: '#f8fafc', padding: 10 }, description: { minHeight: 70, textAlignVertical: 'top' },
  exerciseChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, chip: { backgroundColor: '#334155', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 }, chipActive: { backgroundColor: '#f97316' }, chipText: { color: '#e2e8f0', fontSize: 12 },
  row: { alignItems: 'center', borderTopColor: '#334155', borderTopWidth: 1, flexDirection: 'row', gap: 8, paddingVertical: 8 }, rowText: { color: '#f8fafc', flex: 1, fontWeight: '600' }, smallInput: { backgroundColor: '#0f172a', borderRadius: 6, color: '#fff', padding: 7, width: 48 }, smallLabel: { color: '#94a3b8' }, remove: { color: '#fb923c' },
  primary: { alignItems: 'center', backgroundColor: '#f97316', borderRadius: 8, padding: 11 }, primaryText: { color: '#fff', fontWeight: '700' }, programCard: { borderTopColor: '#334155', borderTopWidth: 1, gap: 4, paddingTop: 10 }, programBadge: { color: '#fbbf24', fontSize: 12, fontWeight: '700' }, message: { color: '#fed7aa' },
});
