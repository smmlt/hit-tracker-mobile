import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  notifyUnauthorized,
  refreshAccessToken,
  setRefreshHandler,
  setUnauthorizedHandler,
} from '../src/services/unauthorized.js';

test('expired-session handler clears only the registered session', () => {
  let calls = 0;
  setUnauthorizedHandler(() => { calls += 1; });
  notifyUnauthorized();
  setUnauthorizedHandler(null);
  notifyUnauthorized();
  assert.equal(calls, 1);
});

test('concurrent expired requests share one refresh operation', async () => {
  let calls = 0;
  let resolveRefresh;
  setRefreshHandler(() => {
    calls += 1;
    return new Promise((resolve) => { resolveRefresh = resolve; });
  });

  const first = refreshAccessToken();
  const second = refreshAccessToken();
  assert.equal(calls, 1);
  resolveRefresh('next-access-token');
  assert.deepEqual(await Promise.all([first, second]), [
    'next-access-token',
    'next-access-token',
  ]);
  setRefreshHandler(null);
});
