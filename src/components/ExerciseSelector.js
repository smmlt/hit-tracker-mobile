import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';

export function ExerciseSelector({ exercises, selectedExerciseId, onSelect }) {
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState(null);

  // Збираємо всі унікальні м'язи з отриманих вправ для створення кнопок фільтрації
  const allMuscles = [];
  exercises.forEach((ex) => {
    ex.muscles?.forEach((m) => {
      if (!allMuscles.some((item) => item.id === m.id)) {
        allMuscles.push(m);
      }
    });
  });

  // Фільтруємо вправи, якщо обрано конкретний м'яз
  const filteredExercises = selectedMuscleFilter
    ? exercises.filter((ex) => ex.muscles?.some((m) => m.id === selectedMuscleFilter))
    : exercises;

  return (
    <View>
      {/* Підкатегорії (фільтри по м'язах) */}
      {allMuscles.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterChip, selectedMuscleFilter === null && styles.filterChipActive]}
            onPress={() => setSelectedMuscleFilter(null)}
          >
            <Text style={[styles.filterText, selectedMuscleFilter === null && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {allMuscles.map((muscle) => {
            const isFilterActive = selectedMuscleFilter === muscle.id;
            return (
              <TouchableOpacity
                key={`muscle-filter-${muscle.id}`}
                style={[styles.filterChip, isFilterActive && styles.filterChipActive]}
                onPress={() => setSelectedMuscleFilter(muscle.id)}
              >
                <Text style={[styles.filterText, isFilterActive && styles.filterTextActive]}>
                  {muscle.commonName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Список самих вправ */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
        {filteredExercises.map((ex) => {
          const isSelected = selectedExerciseId === ex.id;
          // Форматуємо рядок м'язів для підказки
          const muscleNames = ex.muscles?.map((m) => m.commonName).join(', ') || '';

          return (
            <TouchableOpacity
              key={`exercise-${ex.id}`}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => onSelect(ex.id)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {ex.name}
              </Text>
              {muscleNames ? (
                <Text style={[styles.chipSubText, isSelected && styles.chipSubTextActive]}>
                  {muscleNames}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterContainer: { flexDirection: 'row', marginBottom: 10 },
  filterChip: { backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6, borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: '#334155', borderColor: '#FF5722' },
  filterText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  filterTextActive: { color: '#FFF' },

  container: { flexDirection: 'row', marginBottom: 20 },
  chip: { backgroundColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: '#334155', minWidth: 130 },
  chipActive: { backgroundColor: '#FF5722', borderColor: '#FF5722' },
  chipText: { color: '#CBD5E1', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#FFF' },
  chipSubText: { color: '#64748B', fontSize: 10, marginTop: 2 },
  chipSubTextActive: { color: '#FED7AA' },
});