import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://localhost:3000';

export default function ExercisesScreen() {
  const { userToken } = useContext(AuthContext);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchExercises = async () => {
    try {
      const res = await fetch(`${API_URL}/exercises`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setExercises(data);
    } catch (err) {
      console.error('Помилка завантаження вправ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleCreateExercise = async () => {
    if (!name.trim()) {
      alert('Введіть назву вправи');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ name, category }),
      });

      if (res.ok) {
        setName('');
        setCategory('');
        fetchExercises(); // Оновлюємо список
      } else {
        alert('Помилка при створенні вправи');
      }
    } catch (err) {
      console.error('Помилка створення:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>База вправ 📚</Text>

        {/* Форма додавання нових вправ */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Додати нову вправу</Text>
          <TextInput
            style={styles.input}
            placeholder="Назва (наприклад: Жим ногами)"
            placeholderTextColor="#64748B"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Категорія (наприклад: Ноги / Груди)"
            placeholderTextColor="#64748B"
            value={category}
            onChangeText={setCategory}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleCreateExercise} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.addBtnText}>+ Додати до бази</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Список вправ */}
        <Text style={styles.sectionTitle}>Доступні вправи ({exercises.length})</Text>
        {exercises.map((ex) => (
          <View key={ex.id} style={styles.exCard}>
            <View>
              <Text style={styles.exName}>{ex.name}</Text>
              {ex.category && <Text style={styles.exCategory}>{ex.category}</Text>}
            </View>
            <Text style={styles.exId}>ID: #{ex.id}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 20, maxWidth: 800, alignSelf: 'center', width: '100%' },
  centerContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 20 },
  formCard: { backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  formTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  input: { backgroundColor: '#0F172A', color: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 10 },
  addBtn: { backgroundColor: '#22C55E', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  addBtnText: { color: '#FFF', fontWeight: 'bold' },
  sectionTitle: { fontSize: 13, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12 },
  exCard: { backgroundColor: '#1E293B', padding: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  exName: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  exCategory: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  exId: { color: '#64748B', fontSize: 12, fontWeight: 'bold' },
});