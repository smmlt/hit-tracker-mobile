import React from 'react';
import { Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { LanguageContext } from '../../localization/LanguageContext';
import { ExerciseVideoPlayer } from '../media';
import { styles } from './ExerciseDetailsModal.styles';

const SAFETY_TIP_KEYS = ['safetyTipSpine', 'safetyTipWeight', 'safetyTipBreathing', 'safetyTipMovement'];

export function ExerciseDetailsModal({ exercise, onClose, onVideoError, visible }) {
  const { theme } = useTheme();
  const { t } = React.useContext(LanguageContext);
  if (!exercise) return null;

  return (
    <Modal animationType="slide" visible={visible} presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity accessibilityLabel="Close exercise details" onPress={onClose} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: theme.primary }]}>← {t('back')}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{t('exerciseDetails')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.exerciseName, { color: theme.textPrimary }]}>{exercise.name}</Text>
          {exercise.videoUrl ? <ExerciseVideoPlayer onError={onVideoError} source={exercise.videoUrl} style={styles.video} /> : null}
          {exercise.description ? <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{t('description')}:</Text>
            <Text style={[styles.description, { color: theme.textPrimary }]}>{exercise.description}</Text>
          </View> : null}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{t('targetMuscles')}:</Text>
            {exercise.muscles?.length ? <View style={styles.muscleTags}>
              {exercise.muscles.map((muscle) => <View key={muscle.id} style={[styles.muscleTag, { backgroundColor: theme.border }]}>
                <Text style={[styles.muscleTagText, { color: theme.textPrimary }]}>{muscle.commonName} {muscle.scientificName ? `(${muscle.scientificName})` : ''}</Text>
              </View>)}
            </View> : <Text style={[styles.empty, { color: theme.textSecondary }]}>{t('musclesNotSpecified')}</Text>}
          </View>
          <View style={styles.safetyBox}>
            <Text style={[styles.safetyTitle, { color: theme.secondary }]}>🛡️ {t('safetyGuidelines')}:</Text>
            {SAFETY_TIP_KEYS.map((key) => <Text key={key} style={[styles.safetyTip, { color: theme.textSecondary }]}>• {t(key)}</Text>)}
          </View>
          
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
