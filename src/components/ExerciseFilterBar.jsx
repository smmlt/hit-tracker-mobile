import React from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

export function ExerciseFilterBar({
  searchQuery,
  onSearchChange,
  musclesList,
  selectedMuscleFilter,
  onSelectMuscleFilter,
}) {
  return (
    <View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search exercise..."
        placeholderTextColor="#64748B"
        value={searchQuery}
        onChangeText={onSearchChange}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedMuscleFilter === null && styles.filterChipActive,
          ]}
          onPress={() => onSelectMuscleFilter(null)}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedMuscleFilter === null && styles.filterChipTextActive,
            ]}
          >
            All Muscles
          </Text>
        </TouchableOpacity>

        {musclesList.map((m) => {
          const isActive = selectedMuscleFilter === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => onSelectMuscleFilter(isActive ? null : m.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {m.commonName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  filterContainer: { maxHeight: 40, marginBottom: 15 },
  filterChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#FF5722' },
  filterChipText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },
});