import assert from 'node:assert/strict';
import test from 'node:test';
import { exerciseShareUrl, programShareUrl } from '../src/utils/shareLinks.js';

test('shared workshop links use the public web application', () => {
  assert.equal(exerciseShareUrl(42), 'https://app.hit-tracker.com/share/exercises/42');
  assert.equal(
    programShareUrl('6eb8f447-2940-4c70-ae18-355c75ff56ed'),
    'https://app.hit-tracker.com/share/programs/6eb8f447-2940-4c70-ae18-355c75ff56ed',
  );
});
