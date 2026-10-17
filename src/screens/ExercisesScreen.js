/**
 * Browses the exercise catalog with search and category/filter state, loading results from the catalog service and opening exercise details. / Переглядає каталог вправ зі станом пошуку та категорій/фільтрів, завантажує результати з сервісу каталогу й відкриває деталі вправи.
 */
import React, { useContext, useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStyles } from './ExercisesScreen.styles.js';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { apiFetch } from '../services/api';

import { ExerciseFilterBar, ExerciseFormModal, ExerciseItem } from '../components/exercise';

import { palette } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { toggleMuscleRole } from '../utils/muscleRoles';
export default function ExercisesScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { userToken, userData } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const canManageExercises = ['moderator', 'admin', 'super_admin'].includes(userData?.role);

  const [exercises, setExercises] = useState([]);
  const [musclesList, setMusclesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [primaryMuscleIds, setPrimaryMuscleIds] = useState([]);
  const [secondaryMuscleIds, setSecondaryMuscleIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
        apiFetch('/exercises', {}, userToken),
        apiFetch('/exercises/muscles', {}, userToken),
      ]);

      if (resExercises.ok && Array.isArray(resExercises.data)) {
        setExercises(resExercises.data);
      }
      if (resMuscles.ok && Array.isArray(resMuscles.data)) {
        setMusclesList(resMuscles.data);
      }
    } catch (err) {
      console.error('Error fetching exercises:', err);
      showToast(t('exerciseLoadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExercise = async () => {
    if (!name.trim()) {
      showToast(t('exerciseNameRequired'), 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { ok, data } = await apiFetch('/exercises', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          primaryMuscleIds,
          secondaryMuscleIds,
        }),
      }, userToken);

      if (ok) {
        setName('');
        setDescription('');
        setVideoUrl('');
        setPrimaryMuscleIds([]);
        setSecondaryMuscleIds([]);
        setIsModalVisible(false);
        showToast(t('exerciseCreated'), 'success');
        fetchData();
      } else {
        const errorMsg = Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message || t('exerciseCreateFailed');
        
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error creating exercise:', err);
      showToast(t('networkTryAgain'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMuscleSelection = (id, role) => {
    const next = toggleMuscleRole({ primaryIds: primaryMuscleIds, secondaryIds: secondaryMuscleIds }, id, role);
    setPrimaryMuscleIds(next.primaryIds);
    setSecondaryMuscleIds(next.secondaryIds);
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscleFilter
      ? ex.muscles && ex.muscles.some((m) => m.id === selectedMuscleFilter)
      : true;
    return matchesSearch && matchesMuscle;
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <Text style={styles.title}>{t('exerciseWorkshop')} 🛠️</Text>

        <ExerciseFilterBar
          musclesList={musclesList}
          selectedMuscleFilter={selectedMuscleFilter}
          onSelectMuscleFilter={setSelectedMuscleFilter}
        />

        <ScrollView style={styles.listContainer}>
          <Text style={styles.sectionTitle}>
            {t('exercisesFoundCount', { count: filteredExercises.length })}
          </Text>

          {filteredExercises.map((ex) => (
            <ExerciseItem
              key={ex.id}
              exercise={ex}
            />
          ))}
        </ScrollView>

        {canManageExercises && (
          <>
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
              primaryMuscleIds={primaryMuscleIds}
              secondaryMuscleIds={secondaryMuscleIds}
              onToggleMuscle={toggleMuscleSelection}
              onSubmit={handleCreateExercise}
              submitting={submitting}
            />
          </>
        )}
      </View>

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
