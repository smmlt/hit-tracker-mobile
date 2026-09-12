import React, { useContext } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LanguageContext } from '../../localization/LanguageContext';
import { translateCatalogName } from '../../localization/catalog';
import { useTheme } from '../../context/ThemeContext';
import { createStyles } from './HistoryCard.styles';

function formatDuration(totalSeconds, t) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) return `${hours}${t('hourShort')} ${minutes}${t('minuteShort')}`;
  if (minutes) return `${minutes}${t('minuteShort')}`;
  return `${seconds}${t('secondShort')}`;
}

export function HistoryCard({ workout, onPress }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const completedAt = new Date(workout.finishedAt || workout.createdAt);
  const title = workout.programName
    ? translateCatalogName(t, 'program', workout.programName)
    : workout.title || t('workout');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${completedAt.toLocaleDateString(localeTag)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          <Text style={styles.date}>
            {completedAt.toLocaleString(localeTag, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <Ionicons color={theme.textSecondary} name="chevron-forward" size={20} />
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Ionicons color={theme.textSecondary} name="time-outline" size={15} />
          <Text style={styles.metricText}>{formatDuration(workout.activeDurationSeconds, t)}</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons color={theme.textSecondary} name="barbell-outline" size={15} />
          <Text style={styles.metricText}>{workout.exerciseCount} {t('exercisesShort')}</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons color={theme.textSecondary} name="layers-outline" size={15} />
          <Text style={styles.metricText}>{workout.setCount} {t('setsShort')}</Text>
        </View>
      </View>

      {!!workout.exercisePreview?.length && (
        <View style={styles.preview}>
          {workout.exercisePreview.map((name) => (
            <View key={name} style={styles.exerciseChip}>
              <Text numberOfLines={1} style={styles.exerciseChipText}>{translateCatalogName(t, 'exercise', name)}</Text>
            </View>
          ))}
          {!!workout.remainingExerciseCount && (
            <View style={[styles.exerciseChip, styles.moreChip]}>
              <Text style={styles.moreText}>+{workout.remainingExerciseCount}</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}
