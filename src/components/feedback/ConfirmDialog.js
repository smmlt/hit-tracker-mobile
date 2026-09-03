import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function ConfirmDialog({ visible, title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', onCancel, onConfirm }) {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.modalOverlay}>
      <View style={styles.dialogBox}>
        <Text accessibilityRole="header" style={styles.dialogTitle}>{title}</Text>
        <Text style={styles.dialogText}>{message}</Text>
        <View style={styles.dialogButtons}>
          <TouchableOpacity accessibilityRole="button" style={[styles.dialogBtn, styles.cancelBtn]} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={[styles.dialogBtn, styles.confirmBtn]} onPress={onConfirm}>
            <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  dialogBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dialogTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 8 },
  dialogText: { fontSize: 14, color: '#94A3B8', marginBottom: 20, lineHeight: 20 },
  dialogButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  dialogBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelBtn: { backgroundColor: '#334155' },
  cancelBtnText: { color: '#F8FAFC', fontWeight: '600', fontSize: 14 },
  confirmBtn: { backgroundColor: '#EF4444' },
  confirmBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});
