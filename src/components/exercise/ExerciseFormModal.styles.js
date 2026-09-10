import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: palette.overlay70,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: palette.slate800,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: palette.slate50, marginBottom: 15 },
  input: {
    backgroundColor: palette.slate950,
    color: palette.slate50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  label: { color: palette.slate400, fontSize: 13, marginBottom: 6 },
  muscleList: { maxHeight: 120, marginBottom: 15 },
  muscleSelectorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectableChip: {
    backgroundColor: palette.slate950,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectableChipActive: { backgroundColor: palette.orangeLegacy },
  selectableChipText: { color: palette.slate400, fontSize: 12 },
  selectableChipTextActive: { color: palette.whitePure, fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelButton: { backgroundColor: palette.slate700 },
  cancelButtonText: { color: palette.slate300 },
  submitButton: { backgroundColor: palette.orangeLegacy },
  submitButtonText: { color: palette.whitePure, fontWeight: 'bold' },
});
