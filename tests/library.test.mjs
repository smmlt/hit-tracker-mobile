import assert from 'node:assert/strict';
import { test } from 'node:test';
import { difficultyBarColors, mergeWorkoutExercises, programExercises } from '../src/utils/library.js';

test('difficulty uses five bars with the exact saved level and a green-to-red scale', () => {
  const colors = ['#22C55E', '#84CC16', '#FACC15', '#F98300', '#F00D22'];
  for (let level = 1; level <= 5; level += 1) {
    assert.deepEqual(difficultyBarColors(level), [
      ...Array(level).fill(colors[level - 1]),
      ...Array(5 - level).fill('#626262'),
    ]);
  }
  assert.deepEqual(difficultyBarColors(), difficultyBarColors(1));
});

test('adding exercises preserves the current plan and never mutates the original program', () => {
  const program = { schedule: [{ exercise: { id: 2, name: 'Squat' }, setsCount: 3, targetReps: 10, plannedWeight: 20 }, { exercise: null }] };
  const original = JSON.stringify(program);
  const plan = programExercises(program);
  const result = mergeWorkoutExercises(plan, [{ id: 2, sets: 99 }, { id: 3, name: 'Row' }, { id: 3 }, {}]);
  assert.deepEqual(result.map((item) => item.id), [2, 3]);
  assert.equal(result[0].sets, 3);
  assert.equal(plan.length, 1);
  assert.equal(JSON.stringify(program), original);
});

test('empty program produces an empty workout plan', () => {
  assert.deepEqual(programExercises(null), []);
  assert.deepEqual(mergeWorkoutExercises([], []), []);
});

test('a program starts as one full session without copying legacy weekdays or prescribed weights', () => {
  for (const isPersonal of [false, true]) {
    const program = { isPersonal, schedule: [
      { exercise: { id: 1, name: 'Bench press' }, setsCount: 3, targetReps: 6, weekDay: 0, week: 1, plannedWeight: 85 },
      { exercise: { id: 2, name: 'Squat' }, setsCount: 2, targetReps: 8, weekDay: 6, week: 2, plannedWeight: 100 },
    ] };
    const original = JSON.stringify(program);
    const plan = programExercises(program);
    assert.deepEqual(plan.map(({ id, sets, reps }) => ({ id, sets, reps })), [
      { id: 1, sets: 3, reps: 6 }, { id: 2, sets: 2, reps: 8 },
    ]);
    assert.ok(plan.every((item) => item.weight === undefined && item.weekDay === undefined && item.week === undefined));
    assert.equal(JSON.stringify(program), original);
  }
});
