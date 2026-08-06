import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function SetRow({ set, index }) {
  // Формуємо надійний унікальний ключ для кожного підходу
  const setKey = set.id ? String(set.id) : `set-index-${index}`;
  const exerciseTitle = set.exercise?.name ? set.exercise.name : `Exercise #${set.exerciseId || 'Unknown'}`;
  const metricsText = `${set.weight ?? 0} kg × ${set.reps ?? 0} reps (RPE: ${set.rpe ?? 10})`;

  return (
    <View key={setKey} style={styles.setRow}>
      <View style={styles.setMainInfo}>
        <Text style={styles.setNumber}>#{index + 1}</Text>
        <View style={styles.setInfoContainer}>
          <Text style={styles.exerciseName}>{exerciseTitle}</Text>
          <Text style={styles.setMetrics}>{metricsText}</Text>
        </View>
      </View>
      
      {/* Бейдж відмови (Failure), якщо вправу виконано до відмови */}
      {set.isFailure ? (
        <View style={styles.failureBadge}>
          <Text style={styles.failureBadgeText}>FAILURE 🔥</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  setRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#1E293B', 
    padding: 10, 
    borderRadius: 8, 
    marginBottom: 6, 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  setMainInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  setNumber: { color: '#FF5722', fontWeight: 'bold', width: 28, fontSize: 13 },
  setInfoContainer: { flex: 1 },
  exerciseName: { color: '#F8FAFC', fontWeight: '600', fontSize: 14 },
  setMetrics: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  failureBadge: { backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  failureBadgeText: { color: '#EF4444', fontSize: 10, fontWeight: 'bold' },
});