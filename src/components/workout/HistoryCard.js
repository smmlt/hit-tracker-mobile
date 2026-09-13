import React, { useContext, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LanguageContext } from '../../localization/LanguageContext';
import { translateCatalogName } from '../../localization/catalog';
import { useTheme } from '../../context/ThemeContext';
import { visibleExercisePreviewCount } from '../../utils/historyPreview';
import { createStyles } from './HistoryCard.styles';

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
    : `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
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
  const previewNames = (workout.exercisePreview || [])
    .map((name) => translateCatalogName(t, 'exercise', name));
  const totalExerciseCount = Math.max(
    Number(workout.exerciseCount) || 0,
    previewNames.length + (Number(workout.remainingExerciseCount) || 0),
  );
  const [previewWidth, setPreviewWidth] = useState(0);
  const visibleNameCount = visibleExercisePreviewCount({
    containerWidth: previewWidth - 2,
    counterLabel: t('exercisesShort'),
    previewNames,
    totalExerciseCount,
  });
  const remainingExerciseCount = Math.max(0, totalExerciseCount - visibleNameCount);

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
            {completedAt.toLocaleDateString(localeTag, {
              day: 'numeric',
              month: 'long',
            })} · {completedAt.toLocaleTimeString(localeTag, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <Text style={styles.duration}>{formatDuration(workout.activeDurationSeconds)}</Text>
        <Text style={styles.metricText}><Text style={styles.metricValue}>{workout.exerciseCount}</Text> {t('exercisesShort')}</Text>
        <Text style={styles.metricText}><Text style={styles.metricValue}>{workout.setCount}</Text> {t('setsShort')}</Text>
      </View>

      {!!previewNames.length && (
        <View
          onLayout={(event) => setPreviewWidth((current) => {
            const width = event.nativeEvent.layout.width;
            return current === width ? current : width;
          })}
          style={styles.preview}
        >
          <View style={styles.previewNames}>
            {previewNames.slice(0, visibleNameCount).map((name, index) => (
              <Text key={`${name}-${index}`} style={styles.previewText}>{index ? ' · ' : ''}{name}</Text>
            ))}
          </View>
          {!!remainingExerciseCount && <Text style={styles.moreText}>+{remainingExerciseCount} {t('exercisesShort')}</Text>}
        </View>
      )}
    </Pressable>
  );
}
