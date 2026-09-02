import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { apiFetch } from '../services/api';

export const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const { userToken } = useContext(AuthContext);

  const [activeWorkout, setActiveWorkout] = useState(null);
  const [loggedSets, setLoggedSets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Перевірка наявності активного тренування на бекенді
   */
  const checkActiveWorkout = useCallback(async () => {
    if (!userToken) return;

    try {
      setIsLoading(true);
      const res = await apiFetch('/workouts/active', {}, userToken);

      if (res.ok && res.data && res.data.workout) {
        setActiveWorkout(res.data.workout);
        setLoggedSets(res.data.sets || []);
      } else {
        setActiveWorkout(null);
        setLoggedSets([]);
      }
    } catch (err) {
      console.error('Error checking active workout:', err);
      setActiveWorkout(null);
      setLoggedSets([]);
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    checkActiveWorkout();
  }, [checkActiveWorkout]);

  /**
   * Запуск нового тренування
   */
  const startWorkout = async (type = 'HIT Session', scheduleId = null) => {
    if (!userToken) return null;

    try {
      setIsLoading(true);
      const res = await apiFetch('/workouts/start', {
        method: 'POST',
        body: JSON.stringify({ type, ...(scheduleId ? { scheduleId } : {}) }),
      }, userToken);

      if (res.ok && res.data) {
        const workoutData = res.data.workout || res.data;
        setActiveWorkout(workoutData);
        setLoggedSets([]);
        return workoutData;
      }
    } catch (err) {
      console.error('Error starting workout:', err);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  /**
   * Завершення тренування
   */
  const finishWorkout = async (notes = '', durationSeconds = 0) => {
    if (!activeWorkout) return false;

    try {
      setIsLoading(true);
      const res = await apiFetch(`/workouts/${activeWorkout.id}/finish`, {
        method: 'POST',
        body: JSON.stringify({ 
          notes: notes || '', 
          durationSeconds: Number(durationSeconds) || 0,
          finishedAt: new Date().toISOString(),
        }),
      }, userToken);

      if (res.ok) {
        setActiveWorkout(null);
        setLoggedSets([]);
        return true;
      }
    } catch (err) {
      console.error('Error finishing workout:', err);
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  /**
   * Скасування тренування без збереження
   */
  const cancelWorkout = async () => {
    if (!activeWorkout) return;
    try {
      await apiFetch(`/workouts/${activeWorkout.id}`, { method: 'DELETE' }, userToken);
    } catch (e) {
      console.error('Error canceling workout:', e);
    } finally {
      setActiveWorkout(null);
      setLoggedSets([]);
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        setActiveWorkout,
        loggedSets,
        setLoggedSets,
        isLoading,
        startWorkout,
        finishWorkout,
        cancelWorkout,
        checkActiveWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};
