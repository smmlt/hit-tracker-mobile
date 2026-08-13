import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { WorkoutContext } from '../context/WorkoutContext';

export function ActiveWorkoutBanner() {
  const navigation = useNavigation();
  const { activeWorkout } = useContext(WorkoutContext);

  // Якщо немає активного тренування — плашка не відображається
  if (!activeWorkout) return null;

  return (
    <TouchableOpacity
      style={styles.banner}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('ActiveWorkout')}
    >
      <View style={styles.leftContainer}>
        <View style={styles.pulseDot} />
        <View>
          <Text style={styles.title}>Active Workout in Progress</Text>
          <Text style={styles.subtitle}>
            {activeWorkout.type || 'HIT Session'}
          </Text>
        </View>
      </View>
      <Text style={styles.resumeText}>Resume ➔</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#6366F1', // Гарний індиго-колір під темну тему
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E', // Зелений індикатор активності
    marginRight: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 11,
  },
  resumeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});