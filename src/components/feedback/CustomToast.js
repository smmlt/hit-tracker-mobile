import React from 'react';
import { Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { styles } from './CustomToast.styles.js';
import { useTheme } from '../../context/ThemeContext';

export function CustomToast({ 
  visible, 
  message, 
  type = 'error', 
  variant = 'default', 
  fadeAnim, 
  onClose 
}) {
  const { themeName } = useTheme();
  if (!visible) return null;

  const isLight = variant === 'light' && themeName === 'light';
  const isWeb = Platform.OS === 'web';

  return (
    <Animated.View
      accessibilityRole="alert"
      style={[
        styles.toastContainer,
        isLight ? styles.toastLight : (type === 'error' ? styles.toastError : styles.toastSuccess),
        isLight && (type === 'error' ? styles.borderError : styles.borderSuccess),
        isWeb ? styles.toastWeb : { opacity: fadeAnim },
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
