import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  exercisePlanProgress,
  isSetDraftValid,
  replaceRecordedSet,
  rpeColor,
} from '../src/utils/activeWorkout.js';

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
