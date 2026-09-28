import { translateCatalogName } from '../localization/catalog.js';

export const volumeDelta = (thisWeek, lastWeek) =>
  lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 10_000) / 100 : null;

// Prefer the server-computed change (present, possibly null, on newer backends); fall back to a
// locally computed delta only when the field is absent (older backend without volumeChangePercent).
export const summaryVolumeDelta = (summary) =>
  summary.volumeChangePercent !== undefined
    ? summary.volumeChangePercent
    : volumeDelta(summary.thisWeek.volumeKg, summary.lastWeek.volumeKg);

export const isUpdatingStatistics = (lastFinishedWorkoutId, summary) =>
  lastFinishedWorkoutId != null && (!summary?.lastWorkout || Number(summary.lastWorkout.workoutId) < Number(lastFinishedWorkoutId));

export const exerciseName = (t, exercises, id, fallback) => {
  const exercise = exercises.find((item) => Number(item.id) === Number(id));
  const name = exercise?.displayName || exercise?.name;
  return name ? translateCatalogName(t, 'exercise', name) : fallback;
};
