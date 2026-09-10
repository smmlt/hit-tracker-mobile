import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { styles } from './SetRow.styles.js';
import { LanguageContext } from '../../localization/LanguageContext';

export function SetRow({ set, index }) {
  const { t } = useContext(LanguageContext);
  // Формуємо надійний унікальний ключ для кожного підходу
  const setKey = set.id ? String(set.id) : `set-index-${index}`;
  const exerciseTitle = set.exercise?.name || t('exerciseUnknown', { id: set.exerciseId || t('unknown') });
  const metricsText = `${set.weight ?? 0} ${t('kilogramsShort')} × ${set.reps ?? 0} ${t('repsShort')} (RPE: ${set.rpe ?? 10})`;

  return (
    <View key={setKey} style={styles.setRow}>
      <View style={styles.setMainInfo}>
        <Text style={styles.setNumber}>#{index + 1}</Text>
        <View style={styles.setInfoContainer}>
          <Text numberOfLines={1} style={styles.exerciseName}>{exerciseTitle}</Text>
          <Text style={styles.setMetrics}>{metricsText}</Text>
        </View>
      </View>
      
      {/* Бейдж відмови (Failure), якщо вправу виконано до відмови */}
      {set.isFailure ? (
        <View style={styles.failureBadge}>
          <Text style={styles.failureBadgeText}>{t('failure')} 🔥</Text>
        </View>
      ) : null}
    </View>
  );
}
