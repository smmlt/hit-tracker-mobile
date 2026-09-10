import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const createStyles = (theme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 15 },
  input: {
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  label: { color: theme.textSecondary, fontSize: 13, marginBottom: 6 },
  muscleList: { maxHeight: 120, marginBottom: 15 },
  muscleSelectorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectableChip: {
    backgroundColor: theme.filterChipBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectableChipActive: { backgroundColor: theme.primary },
  selectableChipText: { color: theme.filterChipText, fontSize: 12 },
  selectableChipTextActive: { color: theme.onPrimary, fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelButton: { backgroundColor: theme.surfaceElevated, borderColor: theme.border, borderWidth: 1 },
  cancelButtonText: { color: theme.textPrimary },
  submitButton: { backgroundColor: theme.primary },
  submitButtonText: { color: theme.onPrimary, fontWeight: 'bold' },
});
