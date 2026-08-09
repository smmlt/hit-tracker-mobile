import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../constants/config';

import { ExerciseItem } from '../components/ExerciseItem';
import { ExerciseFormModal } from '../components/ExerciseFormModal';
import { ExerciseFilterBar } from '../components/ExerciseFilterBar';

export default function ExercisesScreen() {
  const { userToken } = useContext(AuthContext);

  const [exercises, setExercises] = useState([]);
  const [musclesList, setMusclesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Стан фільтрів та відкритих карток
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);

  // Стан модального вікна додавання вправи
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedMuscleIds, setSelectedMuscleIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Стан для кастомних Toast-сповіщень та їх анімації
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  /**
   * Показує плавальне сповіщення (Toast) з анімацією появи та автоприховуванням
   */
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      });
    }, 4000);
  };

  const fetchData = async () => {
    try {
      const [resExercises, resMuscles] = await Promise.all([
        fetch(`${API_URL}/exercises`, {
          headers: { Authorization: `Bearer ${userToken}` },
        }),
        fetch(`${API_URL}/exercises/muscles`, {
          headers: { Authorization: `Bearer ${userToken}` },
        }),
      ]);

      const dataExercises = await resExercises.json();
      const dataMuscles = await resMuscles.json();

      if (Array.isArray(dataExercises)) setExercises(dataExercises);
      if (Array.isArray(dataMuscles)) setMusclesList(dataMuscles);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      showToast('Failed to load exercises', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExercise = async () => {
    if (!name.trim()) {
      showToast('Please enter an exercise name', 'error');
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
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          muscleIds: selectedMuscleIds,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setName('');
        setDescription('');
        setVideoUrl('');
        setSelectedMuscleIds([]);
        setIsModalVisible(false);
        showToast('Exercise created successfully! 🎉', 'success');
        fetchData();
      } else {
        // Отримуємо повідомлення про дублікат чи іншу помилку з бекенду
        const errorMsg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Failed to create exercise';
        
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error creating exercise:', err);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMuscleSelection = (id) => {
    if (selectedMuscleIds.includes(id)) {
      setSelectedMuscleIds(selectedMuscleIds.filter((mId) => mId !== id));
    } else {
      setSelectedMuscleIds([...selectedMuscleIds, id]);
    }
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesMuscle = selectedMuscleFilter
      ? ex.muscles && ex.muscles.some((m) => m.id === selectedMuscleFilter)
      : true;

    return matchesSearch && matchesMuscle;
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Text style={styles.title}>Exercise Workshop 🛠️</Text>

        <ExerciseFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          musclesList={musclesList}
          selectedMuscleFilter={selectedMuscleFilter}
          onSelectMuscleFilter={setSelectedMuscleFilter}
        />

        <ScrollView style={styles.listContainer}>
          <Text style={styles.sectionTitle}>
            Exercises Found ({filteredExercises.length})
          </Text>

          {filteredExercises.map((ex) => (
            <ExerciseItem
              key={ex.id}
              exercise={ex}
              isExpanded={expandedExerciseId === ex.id}
              onToggleExpand={() =>
                setExpandedExerciseId(
                  expandedExerciseId === ex.id ? null : ex.id
                )
              }
            />
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>

        <ExerciseFormModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          musclesList={musclesList}
          selectedMuscleIds={selectedMuscleIds}
          onToggleMuscle={toggleMuscleSelection}
          onSubmit={handleCreateExercise}
          submitting={submitting}
        />
      </View>

      {/* Рендеринг кастомного Toast-сповіщення */}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            { opacity: fadeAnim },
            toast.type === 'error' ? styles.toastError : styles.toastSuccess,
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
          <TouchableOpacity
            onPress={() => setToast((prev) => ({ ...prev, visible: false }))}
            style={styles.toastClose}
          >
            <Text style={styles.toastCloseText}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  mainContainer: { flex: 1, padding: 20 },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 15 },
  listContainer: { flex: 1 },
  sectionTitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 25,
    backgroundColor: '#FF5722',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabIcon: { color: '#FFF', fontSize: 32, fontWeight: '300', marginTop: -3 },

  // Стилі Toast-сповіщень
  toastContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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