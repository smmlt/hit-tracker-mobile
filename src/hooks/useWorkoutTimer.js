// EN: Derives a live elapsed duration from the active workout timestamps and stops scheduling updates when timing is inactive.
// UK: Обчислює живу тривалість із часових міток активного тренування та припиняє оновлення, коли таймер неактивний.
// EN: The interval derives elapsed time from the start timestamp and is cleared whenever the workout disappears or the hook unmounts.
// UK: Інтервал обчислює тривалість від часу початку й очищається, коли тренування зникає або hook розмонтовується.
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
