import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ExerciseItem({ exercise }) {
  return (
    <View style={styles.exCard}>
      <View style={styles.exInfo}>
        <Text style={styles.exName}>{exercise.name}</Text>
        {exercise.category && <Text style={styles.exCategory}>{exercise.category}</Text>}
      </View>
      <Text style={styles.exId}>ID: #{exercise.id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  exCard: { backgroundColor: '#1E293B', padding: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  exInfo: { flex: 1 },
  exName: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  exCategory: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  exId: { color: '#64748B', fontSize: 12, fontWeight: 'bold' },
});