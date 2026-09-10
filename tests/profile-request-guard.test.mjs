import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProfileRequestGuard } from '../src/utils/profileRequestGuard.js';

test('PROFILE-USERNAME-010 an older profile read cannot overwrite a saved username', () => {
  const guard = createProfileRequestGuard();
  const oldRead = guard.beginRead();
  const save = guard.beginMutation();

  assert.equal(guard.shouldApplyRead(oldRead), false);
  assert.equal(guard.completeMutation(save), true);
  assert.equal(guard.shouldApplyRead(oldRead), false);
});

test('PROFILE-USERNAME-011 a read started during a save is stale after save completes', () => {
  const guard = createProfileRequestGuard();
  const save = guard.beginMutation();
  const concurrentRead = guard.beginRead();

  assert.equal(guard.completeMutation(save), true);
  assert.equal(guard.shouldApplyRead(concurrentRead), false);
});
