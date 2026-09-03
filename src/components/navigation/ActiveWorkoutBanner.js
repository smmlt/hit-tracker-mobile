import React, { useContext, useEffect, useRef } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { WorkoutContext } from '../../context/WorkoutContext';

export function ActiveWorkoutBanner({ navigation: tabNavigation }) {
  const fallbackNavigation = useNavigation();
  const navigation = tabNavigation || fallbackNavigation;
  const { activeWorkout, preparedWorkout } = useContext(WorkoutContext);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  // Якщо немає активного тренування — плашка не відображається
  const workout = activeWorkout || preparedWorkout;
  if (!workout) return null;
  const isPrepared = !activeWorkout;
  const isPaused = activeWorkout?.status === 'paused';

  return (
    <TouchableOpacity
      style={styles.banner}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('ActiveWorkout', { screen: 'WorkoutSession' })}
    >
      <View style={styles.leftContainer}>
        <Animated.View style={[styles.pulseDot, { opacity: pulse, transform: [{ scale: pulse }] }]} />
        <View>
          <Text style={styles.title}>{isPrepared ? 'Workout ready to start' : isPaused ? 'Workout paused' : 'Active workout in progress'}</Text>
          <Text style={styles.subtitle}>
            {workout.title || workout.type || 'HIT Session'}
          </Text>
        </View>
      </View>
      <Text style={styles.resumeText}>{isPrepared ? 'Open ➔' : 'Resume ➔'}</Text>
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
