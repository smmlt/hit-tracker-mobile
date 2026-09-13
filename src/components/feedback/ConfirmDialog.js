import React from 'react';
import { Modal, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { createStyles } from './ConfirmDialog.styles.js';
import { useTheme } from '../../context/ThemeContext';

export function ConfirmDialog({ visible, title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', onCancel, onConfirm }) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const styles = createStyles(theme, width < 390);
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
