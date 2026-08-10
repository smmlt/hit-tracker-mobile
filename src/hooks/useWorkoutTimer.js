// src/hooks/useWorkoutTimer.js
import { useState, useEffect } from 'react';

export function useWorkoutTimer(activeWorkout) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Якщо немає активного тренування або дати початку — скидаємо
    if (!activeWorkout || !activeWorkout.createdAt) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(activeWorkout.createdAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffInSeconds = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(diffInSeconds > 0 ? diffInSeconds : 0);
    };

    // Оновлюємо одразу при завантаженні
    updateTimer();

    // Запускаємо інтервал кожну секунду
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [activeWorkout]);

  return elapsedSeconds;
}