import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://localhost:3000';

/**
 * Кастомний хук для управління станом та запитами активного тренування
 * @param {Object} navigation - об'єкт навігації React Navigation
 * @param {Function} showToast - функція для виведення сповіщень
 */
export function useActiveWorkout(navigation, showToast) {
  const { userToken } = useContext(AuthContext);

  // Основні стани сесії та вправ
  const [workoutId, setWorkoutId] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [loggedSets, setLoggedSets] = useState([]);

  // Поля введення даних для поточного підходу (сету)
  const [weight, setWeight] = useState('80');
  const [reps, setReps] = useState('8');
  const [rpe, setRpe] = useState('10');
  const [isFailure, setIsFailure] = useState(true);

  // Додаткові стани для нотаток та індикаторів завантаження
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingSet, setSubmittingSet] = useState(false);

  // Ініціалізація тренування при першому завантаженні екрана
  useEffect(() => {
    initWorkoutSession();
  }, []);

  /**
   * Завантажує список доступних вправ та створює нову сесію тренування на сервері
   */
  const initWorkoutSession = async () => {
    try {
      setLoading(true);
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      };

      // 1. Отримуємо бібліотеку вправ
      const exRes = await fetch(`${API_URL}/exercises`, { headers });
      const exData = await exRes.json();
      if (Array.isArray(exData) && exData.length > 0) {
        setExercises(exData);
        setSelectedExerciseId(exData[0].id); // Автоматично вибираємо першу вправу
      }

      // 2. Запускаємо нову сесію тренування
      const wRes = await fetch(`${API_URL}/workouts/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: 'HIT Session' }),
      });
      const wData = await wRes.json();
      if (wData?.workout?.id) {
        setWorkoutId(wData.workout.id);
      }
    } catch (err) {
      console.error('Initialization error:', err);
      showToast('Failed to initialize workout session', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Надсилає дані про виконаний сет на сервер та додає його до локального списку
   */
  const handleRecordSet = async () => {
    // Валідація заповненості обов'язкових полів
    if (!workoutId || !selectedExerciseId || !weight || !reps) {
      showToast('Please fill in weight and reps!', 'error');
      return;
    }

    setSubmittingSet(true);
    try {
      const response = await fetch(`${API_URL}/workouts/${workoutId}/sets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          exerciseId: Number(selectedExerciseId),
          weight: parseFloat(weight),
          reps: parseInt(reps, 10),
          isFailure,
          rpe: parseInt(rpe, 10),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Знаходимо назву поточної вправи для відображення у списку
        const currentEx = exercises.find((e) => e.id === Number(selectedExerciseId));
        setLoggedSets((prev) => [
          ...prev,
          {
            id: data.set?.id || Date.now(),
            exerciseName: currentEx?.name || 'Exercise',
            weight,
            reps,
            isFailure,
            rpe,
          },
        ]);
        showToast('Set recorded successfully 🔥', 'success');
      } else {
        showToast(data.message || 'Failed to record set', 'error');
      }
    } catch (err) {
      console.error('Error recording set:', err);
      showToast('Network error while recording set', 'error');
    } finally {
      setSubmittingSet(false);
    }
  };

  /**
   * Завершує активну сесію тренування, передаючи нотатки
   */
  const handleFinishWorkout = async () => {
    if (!workoutId) return;

    try {
      const response = await fetch(`${API_URL}/workouts/${workoutId}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        showToast('Workout successfully saved! 💪', 'success');
        setTimeout(() => {
          if (navigation) navigation.goBack(); // Повернення на попередній екран
        }, 1200);
      } else {
        showToast('Failed to finish workout', 'error');
      }
    } catch (err) {
      console.error('Error finishing workout:', err);
      showToast('Network error while saving workout', 'error');
    }
  };

  return {
    workoutId,
    exercises,
    selectedExerciseId,
    setSelectedExerciseId,
    loggedSets,
    weight,
    setWeight,
    reps,
    setReps,
    rpe,
    setRpe,
    isFailure,
    setIsFailure,
    notes,
    setNotes,
    loading,
    submittingSet,
    handleRecordSet,
    handleFinishWorkout,
  };
}