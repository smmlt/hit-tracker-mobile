import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

export function StartWorkoutCard({ onPress, disabled = false }) {
  return (
    <TouchableOpacity disabled={disabled} style={[styles.heroCard, disabled && styles.disabled]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.heroBadge}>READY TO WORKOUT?</Text>
      <Text style={styles.heroTitle}>Start Workout 🏋️‍♂️</Text>
      <Text style={styles.heroSubtitle}>
        Log weight, reps, and high-intensity failure sets in real-time.
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#FF5722',
    padding: 24,
    borderRadius: 16,
    marginBottom: 28,
  },
  disabled: { opacity: 0.55 },
  heroBadge: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  heroSubtitle: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, lineHeight: 18 },
});
