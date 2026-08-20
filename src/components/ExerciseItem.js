import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Linking, 
  StyleSheet, 
  Modal, 
  SafeAreaView, 
  ScrollView 
} from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { HeartIcon, DropIcon } from '../assets/icons'; 

const DEFAULT_SAFETY_TIPS = [
  'Keep your spine in a neutral position (avoid excessive arching)',
  'Do not use excessive weight at the expense of proper technique',
  'Control your breathing: exhale on exertion, inhale on release',
  'Perform movements smoothly without sudden jerks',
];

export function ExerciseItem({ exercise, onToggleLike }) {
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
      {/* ================= КАРТОЧКА ВПРАВИ ================= */}
      <TouchableOpacity 
        activeOpacity={0.7} 
        style={({ pressed }) => [
          styles.cardWrapper, 
          { 
            backgroundColor: '#292929', 
            borderColor: theme.border 
          },
          pressed && { opacity: 0.75 }
        ]} 
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.cardInnerRow}>
          
          {/* ЛІВА КОЛОНКА: Заглушка для фото */}
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>PHOTO</Text>
          </View>

          {/* ПРАВА КОЛОНКА: Інформація (з відступом та вертикальним центром) */}
          <View style={styles.infoContainer}>
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
              {exercise.name}
            </Text>

            <Text style={[styles.muscles, { color: theme.textSecondary }]} numberOfLines={1}>
              {musclesText}
            </Text>

            <View style={styles.statsRow}>
              {/* Кнопка Лайку */}
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

              {/* Складність (Краплі) */}
              <View style={styles.difficultyContainer}>
                {renderDifficultyDrops()}
              </View>

              {/* Кількість лайків */}
              <Text style={[styles.likesCount, { color: theme.textPrimary }]}>
                {formatLikes(exercise.likesCount || 0)}
              </Text>
            </View>
          </View>

        </View>
      </TouchableOpacity>

      {/* ================= МОДАЛЬНЕ ВІКНО ================= */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.backButton}
            >
              <Text style={[styles.backButtonText, { color: theme.primary }]}>← Назад</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Деталі вправи</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            <Text style={[styles.detailExerciseName, { color: theme.textPrimary }]}>{exercise.name}</Text>

            {exercise.description && (
              <View style={styles.sectionBlock}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Опис:</Text>
                <Text style={[styles.descriptionText, { color: theme.textPrimary }]}>{exercise.description}</Text>
              </View>
            )}

            <View style={styles.sectionBlock}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Цільові м'язи:</Text>
              {exercise.muscles && exercise.muscles.length > 0 ? (
                <View style={styles.muscleTagsContainer}>
                  {exercise.muscles.map((m) => (
                    <View key={m.id} style={[styles.muscleTag, { backgroundColor: theme.border }]}>
                      <Text style={[styles.muscleTagText, { color: theme.textPrimary }]}>
                        {m.commonName} {m.scientificName ? `(${m.scientificName})` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Muscles not specified</Text>
              )}
            </View>

            <View style={[styles.safetyBox, { backgroundColor: '#292929' }]}>
              <Text style={[styles.safetyTitle, { color: theme.secondary }]}>🛡️ Safety Guidelines:</Text>
              {DEFAULT_SAFETY_TIPS.map((tip, idx) => (
                <Text key={idx} style={[styles.safetyTipText, { color: theme.textSecondary }]}>
                  • {tip}
                </Text>
              ))}
            </View>

            {exercise.videoUrl && (
              <TouchableOpacity
                style={[styles.videoButton, { backgroundColor: theme.primary }]}
                onPress={() => Linking.openURL(exercise.videoUrl)}
              >
                <Text style={styles.videoButtonText}>
                  ▶ Watch Technique (YouTube)
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    width: '100%',
    marginBottom: 4,
    backgroundColor: '#292929',
  },
  imagePlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 10,
    backgroundColor: '#7C3AED', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    flexShrink: 0,
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  muscles: {
    fontSize: 13,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  likesCount: {
    fontSize: 13,
    fontWeight: '600',
  },

  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  modalTitle: { fontSize: 16, fontWeight: 'bold' },
  modalScroll: { padding: 20 },
  detailExerciseName: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  sectionBlock: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 8 },
  descriptionText: { fontSize: 15, lineHeight: 22 },
  emptyText: { fontSize: 14, fontStyle: 'italic' },
  muscleTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muscleTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  muscleTagText: { fontSize: 13 },
  safetyBox: { 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 20, 
    borderLeftWidth: 4, 
    borderLeftColor: '#EAB308' 
  },
  safetyTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  safetyTipText: { fontSize: 13, marginBottom: 6 },
  videoButton: { 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  videoButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});