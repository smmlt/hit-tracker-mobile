import React from 'react';
import { Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';

export function CustomToast({ 
  visible, 
  message, 
  type = 'error', 
  variant = 'default', 
  fadeAnim, 
  onClose 
}) {
  if (!visible) return null;

  const isLight = variant === 'light';

  return (
    <Animated.View
      accessibilityRole="alert"
      style={[
        styles.toastContainer,
        isLight ? styles.toastLight : (type === 'error' ? styles.toastError : styles.toastSuccess),
        isLight && (type === 'error' ? styles.borderError : styles.borderSuccess),
        { opacity: fadeAnim },
      ]}
    >
      <Text
        style={[
          styles.toastText,
          isLight ? (type === 'error' ? styles.textErrorLight : styles.textSuccessLight) : styles.textDark,
        ]}
      >
        {message}
      </Text>
      <TouchableOpacity onPress={onClose} style={styles.toastClose}>
        <Text style={[styles.toastCloseText, isLight && styles.closeTextLight]}>✕</Text>
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
    zIndex: 2000,
    maxWidth: '90%',
    width: '90%',
  },
  
  // Стандартная темна тема (для основного інтерфейсу)
  toastSuccess: { backgroundColor: '#10B981', elevation: 6 },
  toastError: { backgroundColor: '#EF4444', elevation: 6 },
  textDark: { color: '#FFFFFF' },

  // Світла тема (для екрану входу та реєстрації)
  toastLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  borderError: { borderColor: '#FCA5A5' },
  borderSuccess: { borderColor: '#6EE7B7' },
  textErrorLight: { color: '#DC2626' },
  textSuccessLight: { color: '#059669' },
  closeTextLight: { color: '#9CA3AF' },

  // Общие стили
  toastText: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 12 },
  toastClose: { padding: 4 },
  toastCloseText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
});
