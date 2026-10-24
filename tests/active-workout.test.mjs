// EN: Proves the production contract for active workout progress, set-draft validation, replacement behavior, and RPE presentation helpers; fixtures model user-visible behavior and integration boundaries rather than implementation details.
// UK: Перевіряє робочий контракт прогресу активного тренування, валідації чернетки підходу, заміни вправ і допоміжного представлення RPE; фікстури відтворюють поведінку користувача й межі інтеграції, а не деталі реалізації.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  durationSetTimerDisplay,
  exercisePlanProgress,
  isDurationSetDraftValid,
  isSetDraftValid,
  parseDurationInput,
  replaceRecordedSet,
  rpeColor,
  shouldSignalDurationTarget,
  workoutPlanCompletion,
} from '../src/utils/activeWorkout.js';

test('manual timed-set input accepts seconds and MM:SS only', () => {
  assert.equal(parseDurationInput('1:05'), 65);
  assert.equal(parseDurationInput('45'), 45);
  assert.equal(parseDurationInput('00:38'), 38);
  for (const value of ['', '1:5', '1:60', '-1', '1:05:00', 'abc', '99999999999999999999']) {
    assert.equal(parseDurationInput(value), null);
  }
});

test('timed set counts down, shows overtime, and signals only at the first crossing', () => {
  assert.deepEqual(durationSetTimerDisplay(45, 0), { text: '00:45', overtime: false });
  assert.deepEqual(durationSetTimerDisplay(45, 45), { text: '+00:00', overtime: true });
  assert.deepEqual(durationSetTimerDisplay(45, 50), { text: '+00:05', overtime: true });
  assert.deepEqual(durationSetTimerDisplay(0, 5), { text: '00:05', overtime: false });
  assert.equal(shouldSignalDurationTarget(45, 44, 45), true);
  assert.equal(shouldSignalDurationTarget(45, 44, 46), true);
  assert.equal(shouldSignalDurationTarget(45, 45, 46), false);
  assert.equal(shouldSignalDurationTarget(0, 0, 1), false);
});

test('duration completion uses planned set count and aggregate seconds', () => {
  const item = { measurementType: 'duration', sets: 3, durationSeconds: 45 };
  assert.equal(exercisePlanProgress(item, [{ durationSeconds: 40 }, { durationSeconds: 45 }, { durationSeconds: 50 }]).complete, true);
  assert.equal(exercisePlanProgress(item, [{ durationSeconds: 44 }, { durationSeconds: 45 }, { durationSeconds: 45 }]).complete, false);
  assert.equal(exercisePlanProgress(item, [{ durationSeconds: 135 }]).complete, false);
});

test('duration set confirmation requires positive seconds and RPE', () => {
  assert.equal(isDurationSetDraftValid({ durationSeconds: 45, rpe: 8 }), true);
  assert.equal(isDurationSetDraftValid({ durationSeconds: 0, rpe: 8 }), false);
  assert.equal(isDurationSetDraftValid({ durationSeconds: 45, rpe: '' }), false);
});

test('workout completion combines rep and duration exercises without cross-credit', () => {
  const plan = [
    { id: 1, sets: 2, reps: 10 },
    { id: 2, measurementType: 'duration', sets: 2, durationSeconds: 30 },
  ];
  const sets = new Map([
    [1, [{ reps: 20 }, { reps: 20 }]],
    [2, [{ durationSeconds: 20 }, { durationSeconds: 20 }]],
  ]);
  assert.equal(workoutPlanCompletion(plan, (id) => sets.get(id) || []), 83);
});

test('exercise plan completion uses total repetitions across all recorded sets', () => {
  const progress = exercisePlanProgress(
    { sets: 4, reps: 10 },
    Array.from({ length: 5 }, () => ({ reps: 8 })),
  );
  assert.equal(progress.targetReps, 40);
  assert.equal(progress.actualReps, 40);
  assert.equal(progress.complete, true);
});

test('exercise plan completion requires both the planned sets and total repetitions', () => {
  assert.equal(exercisePlanProgress({ sets: 4, reps: 10 }, [{ reps: 40 }]).complete, false);
  assert.equal(exercisePlanProgress({ sets: 4, reps: 10 }, Array.from({ length: 4 }, () => ({ reps: 8 }))).complete, false);
});

test('sets without a repetition target fall back to planned set count', () => {
  assert.equal(exercisePlanProgress({ sets: 3 }, [{ reps: 5 }, { reps: 5 }]).complete, false);
  assert.equal(exercisePlanProgress({ sets: 3 }, [{ reps: 5 }, { reps: 5 }, { reps: 1 }]).complete, true);
});

test('set confirmation requires explicit weight, positive reps, and RPE 1-10', () => {
  assert.equal(isSetDraftValid({ weight: '0', reps: '8', rpe: '7' }), true);
  assert.equal(isSetDraftValid({ weight: '', reps: '8', rpe: '7' }), false);
  assert.equal(isSetDraftValid({ weight: '50', reps: '0', rpe: '7' }), false);
  assert.equal(isSetDraftValid({ weight: '50', reps: '8', rpe: '' }), false);
  assert.equal(isSetDraftValid({ weight: '50', reps: '8', rpe: '11' }), false);
});

test('editing a recorded set replaces it instead of adding a duplicate', () => {
  assert.deepEqual(
    replaceRecordedSet([{ id: 1, reps: 8 }, { id: 2, reps: 9 }], { id: 1, reps: 10 }),
    [{ id: 1, reps: 10 }, { id: 2, reps: 9 }],
  );
});

test('RPE color scale moves from neutral to accent red', () => {
  assert.equal(rpeColor(1), '#C8C8C8');
  assert.equal(rpeColor(10), '#F00D22');
});
