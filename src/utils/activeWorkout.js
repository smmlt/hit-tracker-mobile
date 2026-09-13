import { palette } from '../constants/colors.js';

const rpeColors = [
  palette.lightGray,
  palette.grayLegacy,
  palette.gray,
  palette.lime,
  palette.difficultyYellow,
  palette.yellow,
  palette.orange,
  palette.orangeLegacy,
  palette.red,
  palette.accent,
];

export function exercisePlanProgress(item, recordedSets) {
  const plannedSets = Math.max(0, Number(item?.sets) || 0);
  const plannedReps = Math.max(0, Number(item?.reps) || 0);
  const actualSets = recordedSets?.length || 0;
  const actualReps = (recordedSets || []).reduce(
    (total, set) => total + Math.max(0, Number(set.reps) || 0),
    0,
  );
  const targetReps = plannedSets * plannedReps;
  const complete = plannedSets > 0
    && actualSets >= plannedSets
    && (targetReps === 0 || actualReps >= targetReps);

  return { actualReps, actualSets, complete, plannedSets, targetReps };
}

export function isSetDraftValid({ reps, rpe, weight }) {
  const parsedReps = Number(reps);
  const parsedRpe = Number(rpe);
  const parsedWeight = Number(weight);
  return String(weight).trim() !== ''
    && Number.isFinite(parsedWeight)
    && parsedWeight >= 0
    && Number.isInteger(parsedReps)
    && parsedReps > 0
    && Number.isInteger(parsedRpe)
    && parsedRpe >= 1
    && parsedRpe <= 10;
}

export const rpeColor = (value) => rpeColors[Math.max(1, Math.min(10, Number(value) || 1)) - 1];

export function replaceRecordedSet(sets, nextSet) {
  const index = sets.findIndex((set) => set.id === nextSet.id);
  if (index < 0) return [...sets, nextSet];
  return sets.map((set, currentIndex) => currentIndex === index ? nextSet : set);
}
