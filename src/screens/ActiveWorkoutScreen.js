import React, { useState, useRef } from 'react';
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
  Animated,
} from 'react-native';

import { useActiveWorkout } from '../hooks/useActiveWorkout';
import { ExerciseSelector } from '../components/ExerciseSelector';
import { LoggedSetsList } from '../components/LoggedSetsList';

export default function ActiveWorkoutScreen({ navigation }) {
  // Стан для кастомних Toast-сповіщень та їх анімації зникнення
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  /**
   * Показує плавальне сповіщення (Toast) з анімацією появи та автоприховуванням
   */
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      });
    }, 4000);
  };

  // Отримуємо всю логіку з кастомного хука
  const {
    workoutId,
    exercises,
    selectedExerciseId,
    setSelectedExerciseId,
    loggedSets,
    weight,
    setWeight,
    reps,
    setReps,
    rpe,
    setRpe,
    isFailure,
    setIsFailure,
    notes,
    setNotes,
    loading,
    submittingSet,
    handleRecordSet,
    handleFinishWorkout,
  } = useActiveWorkout(navigation, showToast);

  // Показуємо спінер завантаження під час ініціалізації сесії
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Initializing HIT session...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Шапка тренування */}
        <View style={styles.header}>
          <Text style={styles.title}>Active HIT Workout ⚡</Text>
          <Text style={styles.sessionBadge}>Session ID: #{workoutId}</Text>
        </View>

        {/* Секція 1: Вибір вправи через окремий компонент */}
        <Text style={styles.sectionTitle}>1. Select Exercise</Text>
        <ExerciseSelector 
          exercises={exercises} 
          selectedExerciseId={selectedExerciseId} 
          onSelect={setSelectedExerciseId} 
        />

        {/* Секція 2: Введення метрик поточного підходу */}
        <Text style={styles.sectionTitle}>2. Set Metrics</Text>
        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="0" placeholderTextColor="#64748B" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reps</Text>
              <TextInput style={styles.input} value={reps} onChangeText={setReps} keyboardType="numeric" placeholder="0" placeholderTextColor="#64748B" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>RPE (1-10)</Text>
              <TextInput style={styles.input} value={rpe} onChangeText={setRpe} keyboardType="numeric" placeholder="10" placeholderTextColor="#64748B" />
            </View>
          </View>

          {/* Перемикач виконання до відмови */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>To absolute failure?</Text>
              <Text style={styles.switchSub}>Core HIT principle</Text>
            </View>
            <Switch value={isFailure} onValueChange={setIsFailure} trackColor={{ false: '#334155', true: '#FF5722' }} thumbColor="#FFF" />
          </View>

          {/* Кнопка надсилання сету */}
          <TouchableOpacity style={styles.recordBtn} onPress={handleRecordSet} disabled={submittingSet}>
            {submittingSet ? <ActivityIndicator color="#FFF" /> : <Text style={styles.recordBtnText}>+ Log HIT Set</Text>}
          </TouchableOpacity>
        </View>

        {/* Секція 3: Список вже записаних сетів */}
        <Text style={styles.sectionTitle}>Logged Sets ({loggedSets.length})</Text>
        <LoggedSetsList sets={loggedSets} />

        {/* Секція 4: Нотатки та збереження тренування */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>3. Finalization</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Workout notes (mood, progress, etc.)"
          placeholderTextColor="#64748B"
          multiline
        />

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinishWorkout}>
          <Text style={styles.finishBtnText}>🏁 Finish & Save Workout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Рендеринг кастомного Toast-сповіщення */}
      {toast.visible && (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Text style={styles.toastText}>{toast.message}</Text>
          <TouchableOpacity onPress={() => setToast((prev) => ({ ...prev, visible: false }))} style={styles.toastClose}>
            <Text style={styles.toastCloseText}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 20, maxWidth: 800, alignSelf: 'center', width: '100%', paddingBottom: 60 },
  loadingContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94A3B8', marginTop: 12, fontSize: 14 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#F8FAFC' },
  sessionBadge: { fontSize: 13, color: '#FF5722', fontWeight: '600', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 },
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
  notesInput: { backgroundColor: '#1E293B', color: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', minHeight: 70, textAlignVertical: 'top', marginBottom: 16 },
  finishBtn: { backgroundColor: '#FF5722', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  finishBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  toastContainer: { position: 'absolute', bottom: 30, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6, zIndex: 2000, maxWidth: '90%' },
  toastSuccess: { backgroundColor: '#10B981' },
  toastError: { backgroundColor: '#EF4444' },
  toastText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', flex: 1, marginRight: 12 },
  toastClose: { padding: 4 },
  toastCloseText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});