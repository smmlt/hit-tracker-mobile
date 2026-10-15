import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { splitMusclesByRole, toggleMuscleRole } from '../src/utils/muscleRoles.js';

test('legacy muscles remain primary and explicit roles are separated', () => {
  assert.deepEqual(splitMusclesByRole([
    { id: 1, role: 'secondary' },
    { id: 2 },
    { id: 3, role: 'primary' },
  ]), {
    primary: [{ id: 2 }, { id: 3, role: 'primary' }],
    secondary: [{ id: 1, role: 'secondary' }],
  });
});

test('choosing a role moves a muscle out of the other role', () => {
  assert.deepEqual(toggleMuscleRole({ primaryIds: [1, 2], secondaryIds: [3] }, 1, 'secondary'), {
    primaryIds: [2],
    secondaryIds: [3, 1],
  });
  assert.deepEqual(toggleMuscleRole({ primaryIds: [2], secondaryIds: [3, 1] }, 1, 'secondary'), {
    primaryIds: [2],
    secondaryIds: [3],
  });
});

test('editor, details, and analytics expose the role contract', () => {
  const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const editor = source('src/components/admin/ExerciseEditor.js');
  assert.match(editor, /primaryMuscleIds: primaryMuscles/);
  assert.match(editor, /secondaryMuscleIds: secondaryMuscles/);
  assert.match(editor, /toggleMuscleRole/);

  const details = source('src/screens/ExerciseDetailsScreen.js');
  assert.match(details, /splitMusclesByRole/);
  assert.match(details, /primaryMuscles/);
  assert.match(details, /secondaryMuscles/);

  const analytics = source('src/screens/AnalyticsMuscleDetailScreen.js');
  assert.match(analytics, /primaryWorkingSets/);
  assert.match(analytics, /secondaryWorkingSets/);
  assert.match(analytics, /workingSets/);
});
