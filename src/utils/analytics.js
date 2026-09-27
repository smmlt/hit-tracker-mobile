export const volumeDelta = (thisWeek, lastWeek) =>
  lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 10_000) / 100 : null;

export const isUpdatingStatistics = (lastFinishedWorkoutId, summary) =>
  lastFinishedWorkoutId != null && (!summary?.lastWorkout || Number(summary.lastWorkout.workoutId) < Number(lastFinishedWorkoutId));

export const exerciseName = (exercises, id, fallback) => {
  const exercise = exercises.find((item) => Number(item.id) === Number(id));
  return exercise?.displayName || exercise?.name || fallback;
};
