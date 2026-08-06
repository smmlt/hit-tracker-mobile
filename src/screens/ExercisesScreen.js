import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { ExerciseForm } from '../components/ExerciseForm';
import { ExerciseItem } from '../components/ExerciseItem';

const API_URL = 'http://localhost:3000';

export default function ExercisesScreen() {
  const { userToken } = useContext(AuthContext);

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Функція для завантаження списку вправ з сервера
  const fetchExercises = async () => {
    try {
      const res = await fetch(`${API_URL}/exercises`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setExercises(data);
    } catch (err) {
      console.error('Error fetching exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  // Обробник створення нової вправи
  const handleCreateExercise = async () => {
    if (!name.trim()) {
      alert('Please enter exercise name');
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
        fetchExercises();
      } else {
        alert('Failed to create exercise');
      }
    } catch (err) {
      console.error('Error creating exercise:', err);
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
        <Text style={styles.title}>Exercise Library 📚</Text>

        {/* Форма додавання нової вправи */}
        <ExerciseForm
          name={name}
          setName={setName}
          category={category}
          setCategory={setCategory}
          onSubmit={handleCreateExercise}
          submitting={submitting}
        />

        {/* Список доступних вправ */}
        <Text style={styles.sectionTitle}>Available Exercises ({exercises.length})</Text>
        {exercises.map((ex) => (
          <ExerciseItem key={ex.id} exercise={ex} />
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
  sectionTitle: { fontSize: 13, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12 },
});