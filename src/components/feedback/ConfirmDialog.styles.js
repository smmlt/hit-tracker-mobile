import { StyleSheet } from 'react-native';

export const createStyles = (theme, compact = false) => StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  dialogBox: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dialogTitle: { fontSize: 18, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 8 },
  dialogText: { fontSize: 14, color: theme.textSecondary, marginBottom: 20, lineHeight: 20 },
  dialogButtons: { flexDirection: compact ? 'column' : 'row', gap: 10 },
  dialogBtn: { alignItems: 'center', borderRadius: 8, flex: compact ? 0 : 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, width: compact ? '100%' : undefined },
  cancelBtn: { backgroundColor: theme.surfaceElevated, borderColor: theme.border, borderWidth: 1 },
  cancelBtnText: { color: theme.textPrimary, fontWeight: '600', fontSize: 14, textAlign: 'center' },
  confirmBtn: { backgroundColor: theme.primary },
  confirmBtnText: { color: theme.onPrimary, fontWeight: '600', fontSize: 14, textAlign: 'center' },
});
