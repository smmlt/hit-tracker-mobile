import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { createStyles } from './LoggedSetsList.styles.js';
import { LanguageContext } from '../../localization/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * Відображає історію записаних сетів або текст-заглушку, якщо їх ще немає
 */
export function LoggedSetsList({ sets = [] }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { t } = useContext(LanguageContext);
  // Якщо сесій ще немає — показуємо заглушку
  if (sets.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>{t('noSetsLogged')}</Text>
      </View>
    );
  }

  // Рендеримо кожен записаний сет
  return sets.map((set, idx) => (
    <View key={set.id ? `set-${set.id}` : `set-idx-${idx}`} style={styles.setRow}>
      <Text style={styles.setTextIndex}>#{idx + 1}</Text>
      <View style={styles.details}>
        <Text style={styles.setName}>{set.exerciseName}</Text>
        <Text style={styles.setDetails}>
          {set.weight} {t('kilogramsShort')} × {set.reps} {t('repsShort')} | RPE: {set.rpe}
        </Text>
      </View>
      {/* Бейдж "До відмови", якщо перемикач був увімкнений */}
      {set.isFailure && <Text style={styles.failureBadge}>{t('failure')} 🔥</Text>}
    </View>
  ));
}
