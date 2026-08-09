import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';

export function ExerciseFormModal({
  visible,
  onClose,
  name,
  setName,
  description,
  setDescription,
  videoUrl,
  setVideoUrl,
  musclesList,
  selectedMuscleIds,
  onToggleMuscle,
  onSubmit,
  submitting,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>New Exercise 🏋️</Text>

          <TextInput
            style={styles.input}
            placeholder="Exercise Name"
            placeholderTextColor="#64748B"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description & form tips..."
            placeholderTextColor="#64748B"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <TextInput
            style={styles.input}
            placeholder="YouTube Link (optional)"
            placeholderTextColor="#64748B"
            value={videoUrl}
            onChangeText={setVideoUrl}
          />

          <Text style={styles.label}>Select Target Muscles:</Text>
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
                      {m.commonName}
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
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 15 },
  input: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  label: { color: '#94A3B8', fontSize: 13, marginBottom: 6 },
  muscleList: { maxHeight: 120, marginBottom: 15 },
  muscleSelectorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectableChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectableChipActive: { backgroundColor: '#FF5722' },
  selectableChipText: { color: '#94A3B8', fontSize: 12 },
  selectableChipTextActive: { color: '#FFF', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelButton: { backgroundColor: '#334155' },
  cancelButtonText: { color: '#CBD5E1' },
  submitButton: { backgroundColor: '#FF5722' },
  submitButtonText: { color: '#FFF', fontWeight: 'bold' },
});