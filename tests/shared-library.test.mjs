import assert from 'node:assert/strict';
import test from 'node:test';
import { findMatchingPersonalProgram, hasSameExerciseMultiset } from '../src/utils/sharedLibrary.js';

const program = (id, exerciseIds, extra = {}) => ({
  id,
  isPersonal: true,
  createdById: 7,
  schedule: exerciseIds.map((exerciseId) => ({ exercise: { id: exerciseId } })),
  ...extra,
});

test('a shared personal program matches only the owner\'s complete exercise multiset', () => {
  const shared = program(99, [4, 2, 4, 8]);
  const matching = program(12, [8, 4, 2, 4]);

  assert.equal(hasSameExerciseMultiset(shared, matching), true);
  assert.equal(hasSameExerciseMultiset(shared, program(13, [4, 2, 8])), false);
  assert.equal(hasSameExerciseMultiset(shared, program(14, [4, 2, 4, 9])), false);
  assert.equal(findMatchingPersonalProgram([program(13, [4, 2, 8]), matching], shared, 7)?.id, 12);
  assert.equal(findMatchingPersonalProgram([matching], shared, 8), undefined);
});
