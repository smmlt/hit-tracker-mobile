import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { rpeColor } from '../../utils/activeWorkout';
import { createStyles } from './RpePicker.styles';

export function RpePicker({ disabled, label, onChange, onClose, open, value }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const selectedColor = value ? rpeColor(value) : theme.border;

  return <>
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => onChange('open')}
      style={[styles.field, { borderColor: selectedColor }, disabled && styles.disabled]}
    >
      <Text style={[styles.fieldText, { color: value ? selectedColor : theme.textSecondary }]}>{value || '—'}</Text>
      <Ionicons color={theme.textSecondary} name="chevron-down" size={13} />
    </Pressable>

    <Modal animationType="fade" onRequestClose={onClose} transparent visible={open}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable accessibilityRole="menu" style={styles.sheet}>
          <Text style={styles.title}>{label}</Text>
          <ScrollView contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
            {Array.from({ length: 10 }, (_, index) => index + 1).map((rpe) => {
              const color = rpeColor(rpe);
              const selected = Number(value) === rpe;
              return (
                <Pressable
                  accessibilityRole="menuitem"
                  key={rpe}
                  onPress={() => { onChange(String(rpe)); onClose(); }}
                  style={[styles.option, { borderColor: selected ? color : theme.border }, selected && styles.selected]}
                >
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={[styles.optionText, { color: theme.textPrimary }]}>{rpe}</Text>
                  {selected && <Ionicons color={color} name="checkmark" size={22} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}
