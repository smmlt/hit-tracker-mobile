import React, { useContext, useState } from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { styles } from './ExerciseSelector.styles.js';
import { LanguageContext } from '../../localization/LanguageContext';

export function ExerciseSelector({ exercises = [], selectedExerciseId, onSelect }) {
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState(null);
  const { t } = useContext(LanguageContext);

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
              {t('allMuscles')}
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
