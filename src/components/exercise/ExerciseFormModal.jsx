import React, { useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { createStyles } from './ExerciseFormModal.styles.js';

import { palette } from '../../constants/colors';
import { LanguageContext } from '../../localization/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
export function ExerciseFormModal({
  visible,
  onClose,
  name,
  setName,
  description,
  setDescription,
  videoUrl,
  setVideoUrl,
  musclesList = [],
  selectedMuscleIds,
  onToggleMuscle,
  onSubmit,
  submitting,
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { t } = useContext(LanguageContext);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('newExercise')} 🏋️</Text>

          <TextInput
            style={styles.input}
            placeholder={t('exerciseName')}
            placeholderTextColor={theme.inputPlaceholder}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('exerciseFormTips')}
            placeholderTextColor={theme.inputPlaceholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <TextInput
            style={styles.input}
            placeholder={t('youtubeOptional')}
            placeholderTextColor={theme.inputPlaceholder}
            value={videoUrl}
            onChangeText={setVideoUrl}
          />

          <Text style={styles.label}>{t('selectTargetMuscles')}:</Text>
          <ScrollView style={styles.muscleList} nestedScrollEnabled>
            <View style={styles.muscleSelectorContainer}>
              {musclesList.map((m) => {
                const isSelected = selectedMuscleIds.includes(m.id);
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.selectableChip,
                      isSelected && styles.selectableChipActive,
                    ]}
                    onPress={() => onToggleMuscle(m.id)}
                  >
                    <Text
                      style={[
                        styles.selectableChipText,
                        isSelected && styles.selectableChipTextActive,
                      ]}
                    >
                      {m.displayName || m.commonName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={theme.onPrimary} />
              ) : (
                <Text style={styles.submitButtonText}>{t('create')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
