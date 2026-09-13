import assert from 'node:assert/strict';
import test from 'node:test';
import { visibleExercisePreviewCount } from '../src/utils/historyPreview.js';

test('history preview replaces non-fitting exercise names with the remaining count', () => {
  assert.equal(visibleExercisePreviewCount({
    containerWidth: 100,
    counterLabel: 'sets',
    previewNames: ['aaaa', 'bbbb', 'cccc'],
    totalExerciseCount: 4,
  }), 1);
  assert.equal(visibleExercisePreviewCount({
    containerWidth: 120,
    counterLabel: 'sets',
    previewNames: ['aaaa', 'bbbb', 'cccc'],
    totalExerciseCount: 3,
  }), 3);
  assert.equal(visibleExercisePreviewCount({
    containerWidth: 29,
    counterLabel: 'sets',
    previewNames: ['aaaaa'],
    totalExerciseCount: 1,
  }), 0);
});
