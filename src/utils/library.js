import { difficultyColors, palette } from '../constants/colors.js';

export const difficultyBarColors = (difficulty = 1) =>
  difficultyColors.map((_, index) =>
    index < difficulty ? difficultyColors[difficulty - 1] : palette.difficultyInactive,
  );

// A program defines exercises and reps, not the user's working weight or calendar date.
export const programExercises = (program) =>
  (program?.schedule || [])
    .filter((row) => row.exercise?.id)
    .map((row) => ({
      id: row.exercise.id,
      name: row.exercise.name,
      exercise: row.exercise,
      sets: row.setsCount,
      reps: row.targetReps,
      weight: row.plannedWeight,
    }));

// A workout logs sets by exercise ID, so adding an existing exercise must not duplicate it.
export function mergeWorkoutExercises(current, additions) {
  const ids = new Set(current.map((item) => item.id));
  return [
    ...current,
    ...additions.filter((item) => {
      if (!item.id || ids.has(item.id)) return false;
      ids.add(item.id);
      return true;
    }),
  ];
}
