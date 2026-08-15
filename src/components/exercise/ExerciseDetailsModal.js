import React from 'react';
import { Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ExerciseVideoPlayer } from '../media';
import { styles } from './ExerciseDetailsModal.styles';

const SAFETY_TIPS = [
  'Keep your spine in a neutral position (avoid excessive arching)',
  'Do not use excessive weight at the expense of proper technique',
  'Control your breathing: exhale on exertion, inhale on release',
  'Perform movements smoothly without sudden jerks',
];

export function ExerciseDetailsModal({ exercise, onClose, onVideoError, visible }) {
  const { theme } = useTheme();
  if (!exercise) return null;

  return (
    <Modal animationType="slide" visible={visible} presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity accessibilityLabel="Close exercise details" onPress={onClose} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: theme.primary }]}>← Назад</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Деталі вправи</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.exerciseName, { color: theme.textPrimary }]}>{exercise.name}</Text>
          {exercise.description ? <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Опис:</Text>
            <Text style={[styles.description, { color: theme.textPrimary }]}>{exercise.description}</Text>
          </View> : null}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Цільові м'язи:</Text>
            {exercise.muscles?.length ? <View style={styles.muscleTags}>
              {exercise.muscles.map((muscle) => <View key={muscle.id} style={[styles.muscleTag, { backgroundColor: theme.border }]}>
                <Text style={[styles.muscleTagText, { color: theme.textPrimary }]}>{muscle.commonName} {muscle.scientificName ? `(${muscle.scientificName})` : ''}</Text>
              </View>)}
            </View> : <Text style={[styles.empty, { color: theme.textSecondary }]}>Muscles not specified</Text>}
          </View>
          <View style={styles.safetyBox}>
            <Text style={[styles.safetyTitle, { color: theme.secondary }]}>🛡️ Safety Guidelines:</Text>
            {SAFETY_TIPS.map((tip) => <Text key={tip} style={[styles.safetyTip, { color: theme.textSecondary }]}>• {tip}</Text>)}
          </View>
          {exercise.videoUrl ? <ExerciseVideoPlayer onError={onVideoError} source={exercise.videoUrl} style={styles.video} /> : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
