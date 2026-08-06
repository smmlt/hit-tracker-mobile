import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://localhost:3000';

export default function ActiveWorkoutScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);

  // Стан тренування
  const [workoutId, setWorkoutId] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [loggedSets, setLoggedSets] = useState([]);

  // Поля вводу для сету
  const [weight, setWeight] = useState('80');
  const [reps, setReps] = useState('8');
  const [rpe, setRpe] = useState('10');
  const [isFailure, setIsFailure] = useState(true);

  // Нотатки та стани завантаження
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingSet, setSubmittingSet] = useState(false);

  // Ініціалізація: старт тренування та завантаження вправ
  useEffect(() => {
    initWorkoutSession();
  }, []);

  const initWorkoutSession = async () => {
    try {
      setLoading(true);
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      };

      // 1. Завантажуємо вправи
      const exRes = await fetch(`${API_URL}/exercises`, { headers });
      const exData = await exRes.json();
      if (Array.isArray(exData) && exData.length > 0) {
        setExercises(exData);
        setSelectedExerciseId(exData[0].id);
      }

      // 2. Створюємо нову сесію тренування
      const wRes = await fetch(`${API_URL}/workouts/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: 'HIT Session' }),
      });
      const wData = await wRes.json();
      if (wData?.workout?.id) {
        setWorkoutId(wData.workout.id);
      }
    } catch (err) {
      console.error('Помилка ініціалізації:', err);
    } finally {
      setLoading(false);
    }
  };

  // Додавання підходу (сету)
  const handleRecordSet = async () => {
    if (!workoutId || !selectedExerciseId || !weight || !reps) {
      alert('Будь ласка, заповніть вагу та повторення!');
      return;
    }

    setSubmittingSet(true);
    try {
      const response = await fetch(`${API_URL}/workouts/${workoutId}/sets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          exerciseId: Number(selectedExerciseId),
          weight: parseFloat(weight),
          reps: parseInt(reps, 10),
          isFailure,
          rpe: parseInt(rpe, 10),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const currentEx = exercises.find((e) => e.id === Number(selectedExerciseId));
        setLoggedSets((prev) => [
          ...prev,
          {
            id: data.set?.id || Date.now(),
            exerciseName: currentEx?.name || 'Вправа',
            weight,
            reps,
            isFailure,
            rpe,
          },
        ]);
      } else {
        alert(data.message || 'Не вдалося записати сет');
      }
    } catch (err) {
      console.error('Помилка запису сету:', err);
    } finally {
      setSubmittingSet(false);
    }
  };

  // Завершення тренування
  const handleFinishWorkout = async () => {
    if (!workoutId) return;

    try {
      const response = await fetch(`${API_URL}/workouts/${workoutId}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        alert('Тренування успішно збережено! 💪');
        if (navigation) navigation.goBack();
      }
    } catch (err) {
      console.error('Помилка завершення тренування:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Ініціалізація HIT сесії...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Шапка сесії */}
        <View style={styles.header}>
          <Text style={styles.title}>Активне HIT Тренування ⚡</Text>
          <Text style={styles.sessionBadge}>ID Сесії: #{workoutId}</Text>
        </View>

        {/* Секція 1: Вибір вправи */}
        <Text style={styles.sectionTitle}>1. Виберіть вправу</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseSelector}>
          {exercises.map((ex) => {
            const isSelected = selectedExerciseId === ex.id;
            return (
              <TouchableOpacity
                key={ex.id}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setSelectedExerciseId(ex.id)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {ex.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Секція 2: Введення параметрів сету */}
        <Text style={styles.sectionTitle}>2. Метрики підходу</Text>
        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Вага (кг)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Повторення</Text>
              <TextInput
                style={styles.input}
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>RPE (1-10)</Text>
              <TextInput
                style={styles.input}
                value={rpe}
                onChangeText={setRpe}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* Перемикач відмови (HIT) */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>До абсолютної відмови?</Text>
              <Text style={styles.switchSub}>Ключовий принцип HIT</Text>
            </View>
            <Switch
              value={isFailure}
              onValueChange={setIsFailure}
              trackColor={{ false: '#334155', true: '#FF5722' }}
              thumbColor="#FFF"
            />
          </View>

          {/* Кнопка запису сету */}
          <TouchableOpacity
            style={styles.recordBtn}
            onPress={handleRecordSet}
            disabled={submittingSet}
          >
            {submittingSet ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.recordBtnText}>+ Записати HIT Сет</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Секція 3: Список виконаних підходів */}
        <Text style={styles.sectionTitle}>Записані підходи ({loggedSets.length})</Text>
        {loggedSets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Ще немає виконаних підходів у цій сесії.</Text>
          </View>
        ) : (
          loggedSets.map((set, idx) => (
            <View key={idx} style={styles.setRow}>
              <Text style={styles.setTextIndex}>#{idx + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.setName}>{set.exerciseName}</Text>
                <Text style={styles.setDetails}>
                  {set.weight} кг × {set.reps} репів | RPE: {set.rpe}
                </Text>
              </View>
              {set.isFailure && <Text style={styles.failureBadge}>ВІДМОВА 🔥</Text>}
            </View>
          ))
        )}

        {/* Секція 4: Завершення тренування */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>3. Фіналізація</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Нотатки до тренування (самопочуття, прогрес...)"
          placeholderTextColor="#64748B"
          multiline
        />

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinishWorkout}>
          <Text style={styles.finishBtnText}>🏁 Завершити та зберегти тренування</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 20, maxWidth: 800, alignSelf: 'center', width: '100%' },
  loadingContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94A3B8', marginTop: 12, fontSize: 14 },

  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#F8FAFC' },
  sessionBadge: { fontSize: 13, color: '#FF5722', fontWeight: '600', marginTop: 4 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 },

  exerciseSelector: { flexDirection: 'row', marginBottom: 20 },
  chip: { backgroundColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  chipActive: { backgroundColor: '#FF5722', borderColor: '#FF5722' },
  chipText: { color: '#CBD5E1', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#FFF' },

  inputCard: { backgroundColor: '#1E293B', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 24 },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  inputGroup: { flex: 1 },
  label: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#0F172A', color: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155', fontSize: 16, textAlign: 'center' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#334155' },
  switchLabel: { color: '#F8FAFC', fontWeight: '600', fontSize: 14 },
  switchSub: { color: '#64748B', fontSize: 12 },

  recordBtn: { backgroundColor: '#22C55E', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  recordBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  emptyCard: { backgroundColor: '#1E293B', padding: 16, borderRadius: 10, alignItems: 'center' },
  emptyText: { color: '#64748B', fontSize: 13 },

  setRow: { backgroundColor: '#1E293B', padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  setTextIndex: { color: '#FF5722', fontWeight: 'bold', marginRight: 12, fontSize: 14 },
  setName: { color: '#F8FAFC', fontWeight: '600', fontSize: 14 },
  setDetails: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  failureBadge: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  notesInput: { backgroundColor: '#1E293B', color: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', minHeight: 70, textAlignVertical: 'top', marginBottom: 16 },
  finishBtn: { backgroundColor: '#FF5722', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  finishBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});