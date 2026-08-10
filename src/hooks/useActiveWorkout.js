import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { WorkoutContext } from '../context/WorkoutContext';
import { apiFetch } from '../services/api';

export function useActiveWorkout(navigation, showToast) {
  const { userToken, logout } = useContext(AuthContext);
  const {
    activeWorkout,
    loggedSets,
    setLoggedSets,
    startWorkout: contextStartWorkout,
    finishWorkout: contextFinishWorkout,
    isLoading: contextLoading,
  } = useContext(WorkoutContext);

  const workoutId = activeWorkout?.id || null;

  // Локальні стани форми
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);

  const [weight, setWeight] = useState('80');
  const [reps, setReps] = useState('8');
  const [rpe, setRpe] = useState('10');
  const [isFailure, setIsFailure] = useState(true);

  const [notes, setNotes] = useState('');
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [submittingSet, setSubmittingSet] = useState(false);

  // ⏱️ Стан для секундоміра в секундах
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // 💡 Використовуємо useRef для showToast, щоб уникнути нескінченного циклу рендеру
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // ⏱️ Автоматичний розрахунок часу від початку тренування
  useEffect(() => {
    if (!activeWorkout || (!activeWorkout.createdAt && !activeWorkout.startDate)) {
      setElapsedSeconds(0);
      return;
    }

    const startIso = activeWorkout.createdAt || activeWorkout.startDate;
    const startTime = new Date(startIso).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(diff > 0 ? diff : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout]);

  // 🏋️ Завантаження бібліотеки вправ
  const loadExercises = useCallback(async () => {
    if (!userToken) return;
    setLoadingExercises(true);

    try {
      const exRes = await apiFetch('/exercises', {}, userToken);

      // 🚨 Обробка помилки 401: якщо токен невалідний
      if (exRes.status === 401) {
        if (showToastRef.current) {
          showToastRef.current('Сесія закінчилася. Будь ласка, увійдіть знову.', 'error');
        }
        if (logout) logout();
        return;
      }

      if (exRes.ok && Array.isArray(exRes.data)) {
        setExercises(exRes.data);
        if (exRes.data.length > 0) {
          setSelectedExerciseId(String(exRes.data[0].id));
        }
      } else {
        if (showToastRef.current) showToastRef.current('Failed to load exercises', 'error');
      }
    } catch (err) {
      console.error('Error fetching exercises:', err);
      if (showToastRef.current) showToastRef.current('Failed to load exercises', 'error');
    } finally {
      setLoadingExercises(false);
    }
  }, [userToken, logout]); // 👈 Відв'язали від showToast!

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // Запуск тренування за кліком
  const handleStartWorkout = async () => {
    const workout = await contextStartWorkout('HIT Session');
    if (workout) {
      if (showToastRef.current) showToastRef.current('New HIT Session started! 🔥', 'success');
    } else {
      if (showToastRef.current) showToastRef.current('Failed to start workout session', 'error');
    }
  };

  // Запис сету
  const handleRecordSet = async () => {
    if (!workoutId) {
      if (showToastRef.current) showToastRef.current('No active workout found!', 'error');
      return;
    }
    if (!selectedExerciseId || !weight || !reps) {
      if (showToastRef.current) showToastRef.current('Please fill in weight and reps!', 'error');
      return;
    }

    setSubmittingSet(true);
    try {
      const { ok, data, status } = await apiFetch(`/workouts/${workoutId}/sets`, {
        method: 'POST',
        body: JSON.stringify({
          exerciseId: Number(selectedExerciseId),
          weight: parseFloat(weight),
          reps: parseInt(reps, 10),
          isFailure,
          rpe: parseInt(rpe, 10),
        }),
      }, userToken);

      if (status === 401) {
        if (showToastRef.current) showToastRef.current('Сесія закінчилася', 'error');
        if (logout) logout();
        return;
      }

      if (ok) {
        const currentEx = exercises.find((e) => String(e.id) === String(selectedExerciseId));
        const newSet = {
          id: data?.set?.id || data?.id || Date.now(),
          exerciseName: currentEx?.name || 'Exercise',
          weight,
          reps,
          isFailure,
          rpe,
        };
        setLoggedSets((prev) => [...prev, newSet]);
        if (showToastRef.current) showToastRef.current('Set recorded successfully 🔥', 'success');
      } else {
        if (showToastRef.current) showToastRef.current(data?.message || 'Failed to record set', 'error');
      }
    } catch (err) {
      console.error('Error recording set:', err);
      if (showToastRef.current) showToastRef.current('Network error while recording set', 'error');
    } finally {
      setSubmittingSet(false);
    }
  };

  // 🏁 Завершення тренування
  const handleFinishWorkout = async () => {
    if (!workoutId) return;

    const success = await contextFinishWorkout(notes, elapsedSeconds);
    if (success) {
      if (showToastRef.current) showToastRef.current('Workout successfully saved! 💪', 'success');
      setTimeout(() => {
        if (navigation) navigation.goBack();
      }, 1200);
    } else {
      if (showToastRef.current) showToastRef.current('Failed to finish workout', 'error');
    }
  };

  return {
    activeWorkout,
    workoutId,
    elapsedSeconds,
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
    loading: loadingExercises || contextLoading,
    submittingSet,
    handleStartWorkout,
    handleRecordSet,
    handleFinishWorkout,
  };
}