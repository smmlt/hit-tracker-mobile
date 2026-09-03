import assert from 'node:assert/strict';
import { test } from 'node:test';
import { notifyUnauthorized, setUnauthorizedHandler } from '../src/services/unauthorized.js';

test('expired-session handler clears only the registered session', () => {
  let calls = 0;
  setUnauthorizedHandler(() => { calls += 1; });
  notifyUnauthorized();
  setUnauthorizedHandler(null);
  notifyUnauthorized();
  assert.equal(calls, 1);
});
