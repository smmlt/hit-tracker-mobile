import React, { useContext, useEffect, useRef } from 'react';
import { Animated, View, Text, TouchableOpacity } from 'react-native';
import { styles } from './ActiveWorkoutBanner.styles.js';
import { useNavigation } from '@react-navigation/native';
import { WorkoutContext } from '../../context/WorkoutContext';
import { LanguageContext } from '../../localization/LanguageContext';

export function ActiveWorkoutBanner({ navigation: tabNavigation }) {
  const fallbackNavigation = useNavigation();
  const navigation = tabNavigation || fallbackNavigation;
  const { activeWorkout, preparedWorkout } = useContext(WorkoutContext);
  const { t } = useContext(LanguageContext);
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
      onPress={() => navigation.navigate('ActiveWorkout', { screen: 'WorkoutSession', initial: false })}
    >
      <View style={styles.leftContainer}>
        <Animated.View style={[styles.pulseDot, { opacity: pulse, transform: [{ scale: pulse }] }]} />
        <View>
          <Text style={styles.title}>{isPrepared ? t('workoutReadyBanner') : isPaused ? t('workoutPausedBanner') : t('workoutActiveBanner')}</Text>
          <Text style={styles.subtitle}>
            {workout.title || workout.type || t('hitSession')}
          </Text>
        </View>
      </View>
      <Text style={styles.resumeText}>{isPrepared ? t('open') : t('resume')} ➔</Text>
    </TouchableOpacity>
  );
}
