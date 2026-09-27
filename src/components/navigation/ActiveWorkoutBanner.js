import React, { useContext, useEffect, useRef } from 'react';
import { Animated, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWorkout } from '../../context/WorkoutContext';
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from '../../context/ThemeContext';
import { LanguageContext } from '../../localization/LanguageContext';
import { translateCatalogName } from '../../localization/catalog';
import { createStyles } from './ActiveWorkoutBanner.styles.js';

export function ActiveWorkoutBanner({ navigation: tabNavigation }) {
  const fallbackNavigation = useNavigation();
  const navigation = tabNavigation || fallbackNavigation;
  const { activeWorkout, activeVerified, preparedWorkout } = useWorkout(useShallow((state) => ({
    activeWorkout: state.activeWorkout,
    activeVerified: state.activeVerified,
    preparedWorkout: state.preparedWorkout,
  })));
  const { t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  // Until the server has confirmed the rehydrated activeWorkout for this session, treat it as
  // absent so a workout finished/cancelled elsewhere doesn't flash before checkActiveWorkout
  // settles. preparedWorkout is purely local (no server contradiction risk), so it is unaffected.
  const verifiedActiveWorkout = activeVerified ? activeWorkout : null;
  // Якщо немає активного тренування — плашка не відображається
  const workout = verifiedActiveWorkout || preparedWorkout;
  if (!workout) return null;
  const isPrepared = !verifiedActiveWorkout;
  const isPaused = verifiedActiveWorkout?.status === 'paused';
  const workoutName = workout.title || workout.type;
  const localizedWorkoutName = workoutName
    ? translateCatalogName(t, 'program', workoutName)
    : t('hitSession');

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={() => navigation.navigate('ActiveWorkout', { screen: 'WorkoutSession', initial: false })}
      style={styles.banner}
    >
      <View style={styles.leftContainer}>
        <Animated.View style={[styles.pulseDot, { opacity: pulse, transform: [{ scale: pulse }] }]} />
        <View>
          <Text style={styles.title}>{isPrepared ? t('workoutReadyBanner') : isPaused ? t('workoutPausedBanner') : t('workoutActiveBanner')}</Text>
          <Text style={styles.subtitle}>{localizedWorkoutName}</Text>
        </View>
      </View>
      <Text style={styles.resumeText}>{isPrepared ? t('open') : t('resume')} ➔</Text>
    </TouchableOpacity>
  );
}
