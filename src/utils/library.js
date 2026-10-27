// EN: Contains shared catalog/program transformations for difficulty colors, schedules, exercise merging, and card metadata.
// UK: Містить спільні перетворення каталогу/програм для difficulty colors, schedule, обʼєднання вправ і metadata карток.
import { difficultyColors, palette } from '../constants/colors.js';

export const difficultyBarColors = (difficulty = 1) =>
  difficultyColors.map((_, index) =>
    index < difficulty ? difficultyColors[difficulty - 1] : palette.difficultyInactive,
  );

// The program level reflects both each exercise's difficulty and its training volume.
export function programDifficulty(schedule) {
  const rows = (schedule || []).filter((row) => row.exercise);
  if (!rows.length) return null;

  let totalSets = 0;
  let weightedDifficulty = 0;
  let hasAdvancedExercise = false;

  for (const row of rows) {
    const difficulty = Number(row.exercise.difficulty);
    const sets = row.setsCount == null ? 1 : Number(row.setsCount);
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5 || !Number.isFinite(sets) || sets < 1) {
      return null;
    }
    totalSets += sets;
    weightedDifficulty += difficulty * sets;
    hasAdvancedExercise ||= difficulty === 5;
  }

  return {
    level: Math.max(1, Math.min(5, Math.round(weightedDifficulty / totalSets))),
    hasAdvancedExercise,
  };
}

// A program defines exercises and reps, not the user's working weight or calendar date.
export const programExercises = (program) =>
  (program?.schedule || [])
    .filter((row) => row.exercise?.id)
    .map((row) => ({
      id: row.exercise.id,
      name: row.exercise.name,
      exercise: row.exercise,
      sets: row.setsCount ?? row.exercise.recommendedSets,
      reps: (row.exercise.measurementType || 'reps') === 'reps'
        ? row.targetReps ?? row.exercise.recommendedReps
        : undefined,
      durationSeconds: (row.exercise.measurementType || 'reps') === 'duration'
        ? row.targetDurationSeconds ?? row.exercise.recommendedDurationSeconds
        : undefined,
      measurementType: row.exercise.measurementType || 'reps',
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
