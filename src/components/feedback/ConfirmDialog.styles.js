import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: palette.slateOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  dialogBox: {
    backgroundColor: palette.slate800,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: palette.slate700,
  },
  dialogTitle: { fontSize: 18, fontWeight: 'bold', color: palette.slate50, marginBottom: 8 },
  dialogText: { fontSize: 14, color: palette.slate400, marginBottom: 20, lineHeight: 20 },
  dialogButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  dialogBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelBtn: { backgroundColor: palette.slate700 },
  cancelBtnText: { color: palette.slate50, fontWeight: '600', fontSize: 14 },
  confirmBtn: { backgroundColor: palette.red },
  confirmBtnText: { color: palette.whitePure, fontWeight: '600', fontSize: 14 },
});
