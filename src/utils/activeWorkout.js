// EN: Contains presentation helpers for active-workout effort, set values, status labels, and exercise progress.
// UK: Містить presentation helpers для навантаження, значень підходів, status labels і прогресу вправ активного тренування.
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
  const durationExercise = item?.measurementType === 'duration';
  const plannedReps = Math.max(0, Number(item?.reps) || 0);
  const plannedDuration = Math.max(0, Number(item?.durationSeconds ?? item?.targetDurationSeconds) || 0);
  const actualSets = recordedSets?.length || 0;
  const actualReps = (recordedSets || []).reduce(
    (total, set) => total + Math.max(0, Number(set.reps) || 0),
    0,
  );
  const actualDuration = (recordedSets || []).reduce(
    (total, set) => total + Math.max(0, Number(set.durationSeconds) || 0),
    0,
  );
  const targetReps = plannedSets * plannedReps;
  const targetDuration = plannedSets * plannedDuration;
  const complete = plannedSets > 0
    && actualSets >= plannedSets
    && (durationExercise
      ? targetDuration === 0 || actualDuration >= targetDuration
      : targetReps === 0 || actualReps >= targetReps);

  return { actualDuration, actualReps, actualSets, complete, plannedSets, targetDuration, targetReps };
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

export function isDurationSetDraftValid({ durationSeconds, rpe }) {
  const parsedDuration = Number(durationSeconds);
  const parsedRpe = Number(rpe);
  return Number.isInteger(parsedDuration)
    && parsedDuration > 0
    && Number.isInteger(parsedRpe)
    && parsedRpe >= 1
    && parsedRpe <= 10;
}

/** EN: Shows remaining time, then signed overtime, while keeping elapsed seconds for saving. UK: Показує залишок часу, а потім час понад ціль, зберігаючи минулі секунди для запису. */
export function durationSetTimerDisplay(target, elapsed) {
  const seconds = Math.max(0, Number(elapsed) || 0);
  const goal = Math.max(0, Number(target) || 0);
  const overtime = goal > 0 && seconds >= goal;
  const shown = goal > 0 ? Math.abs(goal - seconds) : seconds;
  return { text: `${overtime ? '+' : ''}${String(Math.floor(shown / 60)).padStart(2, '0')}:${String(shown % 60).padStart(2, '0')}`, overtime };
}

/** EN: Signals only when a live countdown first reaches its target. UK: Подає сигнал лише тоді, коли активний відлік уперше досягає цілі. */
export function shouldSignalDurationTarget(target, previous, elapsed) {
  return Number(target) > 0 && previous < Number(target) && elapsed >= Number(target);
}

export function workoutPlanCompletion(plan, setsForExercise) {
  const plannedSets = (plan || []).reduce((total, item) => total + Math.max(0, Number(item?.sets) || 0), 0);
  if (!plannedSets) return null;
  const completedUnits = (plan || []).reduce((total, item) => {
    const progress = exercisePlanProgress(item, setsForExercise(item.id));
    const target = item?.measurementType === 'duration' ? progress.targetDuration : progress.targetReps;
    const actual = item?.measurementType === 'duration' ? progress.actualDuration : progress.actualReps;
    const metricUnits = target > 0 ? (actual / target) * progress.plannedSets : progress.actualSets;
    return total + Math.min(progress.plannedSets, progress.actualSets, metricUnits);
  }, 0);
  return Math.round((completedUnits / plannedSets) * 100);
}

export const rpeColor = (value) => rpeColors[Math.max(1, Math.min(10, Number(value) || 1)) - 1];

export function replaceRecordedSet(sets, nextSet) {
  const index = sets.findIndex((set) => set.id === nextSet.id);
  if (index < 0) return [...sets, nextSet];
  return sets.map((set, currentIndex) => currentIndex === index ? nextSet : set);
}
