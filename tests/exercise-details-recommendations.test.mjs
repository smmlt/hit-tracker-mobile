import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const details = readFileSync(new URL('../src/screens/ExerciseDetailsScreen.js', import.meta.url), 'utf8');
const workshopUi = readFileSync(new URL('../src/components/workshop/ui.js', import.meta.url), 'utf8');

test('exercise details show compatible set and repetition or duration recommendations', () => {
  assert.match(details, /Number\(exercise\.recommendedSets\)/);
  assert.match(details, /Number\(exercise\.recommendedReps\)/);
  assert.match(details, /Number\(exercise\.recommendedDurationSeconds\)/);
  assert.match(details, /recommendedSets.*w\.sets\.toLowerCase\(\).*recommendedTarget/s);
  assert.match(workshopUi, /recommendation: "Recommendation"/);
  assert.match(workshopUi, /recommendation: "Рекомендація"/);
});
