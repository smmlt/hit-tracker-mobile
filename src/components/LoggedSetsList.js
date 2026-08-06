import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Відображає історію записаних сетів або текст-заглушку, якщо їх ще немає
 */
export function LoggedSetsList({ sets }) {
  // Якщо сесій ще немає — показуємо заглушку
  if (sets.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No sets logged in this session yet.</Text>
      </View>
    );
  }

  // Рендеримо кожен записаний сет
  return sets.map((set, idx) => (
    <View key={set.id ? `set-${set.id}` : `set-idx-${idx}`} style={styles.setRow}>
      <Text style={styles.setTextIndex}>#{idx + 1}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.setName}>{set.exerciseName}</Text>
        <Text style={styles.setDetails}>
          {set.weight} kg × {set.reps} reps | RPE: {set.rpe}
        </Text>
      </View>
      {/* Бейдж "До відмови", якщо перемикач був увімкнений */}
      {set.isFailure && <Text style={styles.failureBadge}>FAILURE 🔥</Text>}
    </View>
  ));
}

const styles = StyleSheet.create({
  emptyCard: { backgroundColor: '#1E293B', padding: 16, borderRadius: 10, alignItems: 'center' },
  emptyText: { color: '#64748B', fontSize: 13 },
  setRow: { backgroundColor: '#1E293B', padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  setTextIndex: { color: '#FF5722', fontWeight: 'bold', marginRight: 12, fontSize: 14 },
  setName: { color: '#F8FAFC', fontWeight: '600', fontSize: 14 },
  setDetails: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  failureBadge: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
});