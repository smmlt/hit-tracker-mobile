import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './AppButton.styles';

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...pressableProps
}) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: isPrimary ? theme.primary : '#909090' },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      {...pressableProps}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[styles.label, textStyle]}>{title}</Text>}
    </Pressable>
  );
}
