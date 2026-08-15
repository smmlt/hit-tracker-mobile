import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function HomeHeader({ onLogout }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.greeting}>Welcome back! 💪</Text>
        <Text style={styles.title}>HIT Tracker</Text>
      </View>
      <TouchableOpacity accessibilityRole="button" style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  headerTitleContainer: { flex: 1 },
  greeting: { fontSize: 13, color: '#94A3B8', textTransform: 'uppercase', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#F8FAFC' },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 13 },
});
