import React from 'react';
import { Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';

export function CustomToast({ visible, message, type, fadeAnim, onClose }) {
  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { opacity: fadeAnim },
        type === 'error' ? styles.toastError : styles.toastSuccess,
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
      <TouchableOpacity onPress={onClose} style={styles.toastClose}>
        <Text style={styles.toastCloseText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 6,
    zIndex: 2000,
    maxWidth: '90%',
  },
  toastSuccess: { backgroundColor: '#10B981' },
  toastError: { backgroundColor: '#EF4444' },
  toastText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', flex: 1, marginRight: 12 },
  toastClose: { padding: 4 },
  toastCloseText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});