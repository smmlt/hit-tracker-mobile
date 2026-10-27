// EN: Proves the production contract for workout-library difficulty rendering and exercise/program merge behavior; fixtures model user-visible behavior and integration boundaries rather than implementation details.
// UK: Перевіряє робочий контракт відображення складності в бібліотеці тренувань і обʼєднання вправ та програм; фікстури відтворюють поведінку користувача й межі інтеграції, а не деталі реалізації.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  difficultyBarColors,
  mergeWorkoutExercises,
  programDifficulty,
  programExercises,
} from '../src/utils/library.js';

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

test('program difficulty weighs each exercise by its number of sets', () => {
  assert.deepEqual(
    programDifficulty([
      { setsCount: 1, exercise: { difficulty: 5 } },
      { setsCount: 4, exercise: { difficulty: 2 } },
    ]),
    { level: 3, hasAdvancedExercise: true },
  );
});

test('program difficulty stays hidden until every scheduled exercise has a valid level', () => {
  assert.equal(
    programDifficulty([
      { setsCount: 3, exercise: { difficulty: 2 } },
      { setsCount: 2, exercise: {} },
    ]),
    null,
  );
});

test('a program starts as one full session and keeps planned weight for history', () => {
  for (const isPersonal of [false, true]) {
    const program = { isPersonal, schedule: [
      { exercise: { id: 1, name: 'Bench press' }, setsCount: 3, targetReps: 6, weekDay: 0, week: 1, plannedWeight: 85 },
      { exercise: { id: 2, name: 'Squat' }, setsCount: 2, targetReps: 8, weekDay: 6, week: 2, plannedWeight: 100 },
    ] };
    const original = JSON.stringify(program);
    const plan = programExercises(program);
    assert.deepEqual(plan.map(({ id, sets, reps, weight }) => ({ id, sets, reps, weight })), [
      { id: 1, sets: 3, reps: 6, weight: 85 }, { id: 2, sets: 2, reps: 8, weight: 100 },
    ]);
    assert.ok(plan.every((item) => item.weekDay === undefined && item.week === undefined));
    assert.equal(JSON.stringify(program), original);
  }
});

test('program targets fall back to compatible exercise recommendations', () => {
  const plan = programExercises({ schedule: [
    { exercise: { id: 1, measurementType: 'reps', recommendedSets: 4, recommendedReps: 12, recommendedDurationSeconds: 99 } },
    { exercise: { id: 2, measurementType: 'duration', recommendedSets: 3, recommendedReps: 20, recommendedDurationSeconds: 45 } },
    { exercise: { id: 3, measurementType: 'reps', recommendedSets: 2, recommendedReps: 8 }, setsCount: 5, targetDurationSeconds: 30 },
  ] });
  assert.deepEqual(plan.map(({ sets, reps, durationSeconds }) => ({ sets, reps, durationSeconds })), [
    { sets: 4, reps: 12, durationSeconds: undefined },
    { sets: 3, reps: undefined, durationSeconds: 45 },
    { sets: 5, reps: 8, durationSeconds: undefined },
  ]);
});
