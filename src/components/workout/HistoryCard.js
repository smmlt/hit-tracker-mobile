import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createStyles } from './HistoryCard.styles.js';
import { SetRow } from './SetRow';
import { LanguageContext } from '../../localization/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

// ⏱️ Форматер тривалості для картки
function formatDurationHuman(totalSeconds, t) {
  if (!totalSeconds || totalSeconds <= 0) return `0${t('secondShort')}`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}${t('hourShort')} ${minutes}${t('minuteShort')}`;
  if (minutes > 0) return `${minutes}${t('minuteShort')} ${seconds}${t('secondShort')}`;
  return `${seconds}${t('secondShort')}`;
}

export function HistoryCard({ workout, index, isExpanded, onToggleExpand, onDelete }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const uniqueKey = workout.id ? String(workout.id) : `workout-${index}`;
  const setsCount = workout.sets ? workout.sets.length : 0;
  
  const formattedDate = new Date(workout.finishedAt || workout.createdAt || workout.startDate).toLocaleString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderContainer}>
        <TouchableOpacity
          style={styles.cardHeaderClickable}
          onPress={() => onToggleExpand(uniqueKey)}
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <View style={styles.headerInfo}>
            <Text style={styles.workoutType}>{workout.type || t('hitSession')}</Text>
            <Text style={styles.workoutDate}>{formattedDate}</Text>
          </View>

          <View style={styles.badgeContainer}>
            {/* ⏱️ БЕЙДЖ ТРИВАЛОСТІ */}
            {workout.durationSeconds ? (
              <Text style={styles.durationBadge}>
                ⏱️ {formatDurationHuman(workout.durationSeconds, t)}
              </Text>
            ) : null}

            <Text style={styles.setsBadge}>{setsCount} {t('setsShort')}</Text>
            <Text style={styles.arrow}>{isExpanded ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(workout.id)}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <View style={styles.cardDetails}>
          {workout.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>{t('notes')}:</Text>
              <Text style={styles.notesText}>{workout.notes}</Text>
            </View>
          ) : null}

          <Text style={styles.detailsHeader}>{t('performedSets')}:</Text>

          {setsCount === 0 ? (
            <Text style={styles.noSetsText}>{t('noSetsRecorded')}</Text>
          ) : (
            <View style={styles.setsWrapper}>
              {workout.sets.map((set, setIndex) => (
                <SetRow 
                  key={set.id ? `set-id-${set.id}` : `set-idx-${setIndex}`} 
                  set={set} 
                  index={setIndex} 
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
