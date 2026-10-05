import assert from 'node:assert/strict';
import test from 'node:test';

import {
  defaultSuspensionInput,
  normalizeAccountSuspension,
  suspensionInputToIso,
} from '../src/utils/accountSuspension.js';

test('suspension input is local, strict, and future-only', () => {
  const now = new Date(2026, 9, 5, 10, 0, 0);
  assert.equal(defaultSuspensionInput(now), '2026-10-06 10:00');
  assert.equal(suspensionInputToIso('2026-10-06 12:30', now), new Date(2026, 9, 6, 12, 30).toISOString());
  assert.equal(suspensionInputToIso('2026-02-31 12:30', now), null);
  assert.equal(suspensionInputToIso('2026-10-05 09:59', now), null);
});

test('only a live ACCOUNT_BANNED response is persisted', () => {
  const active = normalizeAccountSuspension({
    code: 'ACCOUNT_BANNED',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    reason: '  Compromised account  ',
  });
  assert.equal(active.reason, 'Compromised account');
  assert.equal(normalizeAccountSuspension({ code: 'OTHER' }), null);
  assert.equal(normalizeAccountSuspension({ code: 'ACCOUNT_BANNED', expiresAt: 'bad' }), null);
});
