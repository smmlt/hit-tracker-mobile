import React, { useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../context/ThemeContext';
import { HeartIcon, DropIcon } from '../../assets/icons';
import { ExerciseDetailsModal } from './ExerciseDetailsModal';
import { styles } from './ExerciseItem.styles';

export function ExerciseItem({ exercise, onPress, onToggleLike, onVideoError }) {
  const { theme } = useTheme();
  const [isModalVisible, setModalVisible] = useState(false);

  // Форматуємо масив м'язів у рядок
  const musclesText = exercise.muscles && exercise.muscles.length > 0
    ? exercise.muscles.map((m) => m.commonName || m.name).join(' • ')
    : 'М\'язи не вказані';

  // Форматування лайків 
  const formatLikes = (num) => {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Малюємо краплі складності
  const renderDifficultyDrops = () => {
    const level = exercise.difficulty || 1;
    const maxDrops = 3;
    const drops = [];

    let dropColor = theme.primary;
    if (level === 1) dropColor = '#22C55E';
    else if (level === 2) dropColor = '#F59E0B';
    else if (level >= 3) dropColor = theme.primary; 

    for (let i = 0; i < maxDrops; i++) {
      const isActive = i < level;
      const currentDropColor = isActive ? dropColor : theme.border;

      drops.push(
        <View key={i} style={{ marginRight: 2 }}>
          <DropIcon 
            width={12} 
            height={12} 
            color={currentDropColor} 
          />
        </View>
      );
    }
    return drops;
  };

  const heartColor = exercise.isLiked ? theme.primary : theme.textSecondary;

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.cardWrapper, 
          { 
            backgroundColor: theme.workoutCardBackground,
            borderColor: theme.border 
          },
          pressed && { opacity: 0.75 }
        ]}
        onPress={() => onPress ? onPress(exercise) : setModalVisible(true)}
      >
          <View style={[styles.cardInnerRow, { backgroundColor: theme.workoutCardBackground }]}>
          
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>PHOTO</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={[styles.title, { color: theme.workoutCardText }]} numberOfLines={1}>
              {exercise.name}
            </Text>

            <Text style={[styles.muscles, { color: theme.workoutCardMutedText }]} numberOfLines={1}>
              {musclesText}
            </Text>

            <View style={styles.statsRow}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={(e) => {
                  e.stopPropagation();
                  if (onToggleLike) onToggleLike(exercise.id);
                }} 
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <HeartIcon 
                  width={16} 
                  height={16} 
                  color={heartColor} 
                />
              </TouchableOpacity>

              <View style={styles.difficultyContainer}>
                {renderDifficultyDrops()}
              </View>

              <Text style={[styles.likesCount, { color: theme.workoutCardText }]}>
                {formatLikes(exercise.likesCount || 0)}
              </Text>
            </View>
          </View>

        </View>
      </Pressable>

      <ExerciseDetailsModal exercise={exercise} onClose={() => setModalVisible(false)} onVideoError={onVideoError} visible={isModalVisible} />
    </>
  );
}
