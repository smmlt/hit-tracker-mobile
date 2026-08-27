import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';

export function MenuCard({ icon, title, subtitle, onPress }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.menuCard, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuCard: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pressed: { opacity: 0.7 },
  menuIcon: { fontSize: 26, marginBottom: 8 },
  menuTitle: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 2 },
  menuSubtitle: { fontSize: 12, color: '#94A3B8' },
});
