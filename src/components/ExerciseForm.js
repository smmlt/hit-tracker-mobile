import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

export function ExerciseForm({ name, setName, category, setCategory, onSubmit, submitting }) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Add New Exercise</Text>
      <TextInput
        style={styles.input}
        placeholder="Name (e.g., Leg Press)"
        placeholderTextColor="#64748B"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Category (e.g., Legs / Chest)"
        placeholderTextColor="#64748B"
        value={category}
        onChangeText={setCategory}
      />
      <TouchableOpacity style={styles.addBtn} onPress={onSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.addBtnText}>+ Add to Library</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: { backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  formTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  input: { backgroundColor: '#0F172A', color: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 10 },
  addBtn: { backgroundColor: '#22C55E', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  addBtnText: { color: '#FFF', fontWeight: 'bold' },
});