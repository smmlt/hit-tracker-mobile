import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  completeRegistration,
  completeVerification,
  createUnknownUserCountdown,
  isUnknownUserError,
} from '../src/utils/authFlow.js';

test('AUTH-REG-001 successful registration persists context and opens verification', async () => {
  const events = [];
  await completeRegistration({
    displayName: 'Bohdan',
    email: 'bohdan@example.com',
    password: 'Password1',
    register: async (...args) => events.push(['request', ...args]),
    persistEmail: async (email) => events.push(['persist', email]),
    navigate: (email) => events.push(['navigate', email]),
  });

  assert.deepEqual(events[0], [
    'request',
    'bohdan@example.com',
    'Password1',
    'Bohdan',
  ]);
  assert.deepEqual(events.at(-1), ['navigate', 'bohdan@example.com']);
});

test('AUTH-REG-002 registration failure does not navigate', async () => {
  let navigated = false;
  await assert.rejects(() => completeRegistration({
    displayName: 'Bohdan',
    email: 'bohdan@example.com',
    password: 'Password1',
    register: async () => { throw new Error('rejected'); },
    persistEmail: async () => {},
    navigate: () => { navigated = true; },
  }), /rejected/);
  assert.equal(navigated, false);
});

test('AUTH-REG-004 navigation waits for pending-email persistence to settle', async () => {
  let finishPersistence;
  let navigated = false;
  const flow = completeRegistration({
    displayName: 'Bohdan',
    email: 'bohdan@example.com',
    password: 'Password1',
    register: async () => {},
    persistEmail: () => new Promise((resolve) => { finishPersistence = resolve; }),
    navigate: () => { navigated = true; },
  });
  await Promise.resolve();
  assert.equal(navigated, false);
  finishPersistence();
  await flow;
  assert.equal(navigated, true);
});

test('AUTH-VERIFY-001 successful verification clears pending state and opens login', async () => {
  const events = [];
  await completeVerification({
    code: '123456',
    email: 'bohdan@example.com',
    verify: async (...args) => events.push(['verify', ...args]),
    clearPendingEmail: async () => events.push(['clear']),
    navigate: (email) => events.push(['navigate', email]),
  });
  assert.deepEqual(events, [
    ['verify', 'bohdan@example.com', '123456'],
    ['clear'],
    ['navigate', 'bohdan@example.com'],
  ]);
});

test('AUTH-VERIFY-002 invalid verification does not clear state or navigate', async () => {
  const events = [];
  await assert.rejects(() => completeVerification({
    code: '000000',
    email: 'bohdan@example.com',
    verify: async () => { throw new Error('invalid'); },
    clearPendingEmail: async () => events.push('clear'),
    navigate: () => events.push('navigate'),
  }), /invalid/);
  assert.deepEqual(events, []);
});

test('AUTH-VERIFY-003 local cleanup failure does not hide server success', async () => {
  let navigated = false;
  await completeVerification({
    code: '123456',
    email: 'bohdan@example.com',
    verify: async () => {},
    clearPendingEmail: async () => { throw new Error('storage unavailable'); },
    navigate: () => { navigated = true; },
  });
  assert.equal(navigated, true);
});

test('AUTH-LOGIN-002 unknown email counts down 5 to 1 then redirects once', async () => {
  const ticks = [];
  let redirects = 0;
  const countdown = createUnknownUserCountdown({
    tickMs: 5,
    onTick: (value) => ticks.push(value),
    onComplete: () => { redirects += 1; },
  });

  countdown.start();
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.deepEqual(ticks, [5, 4, 3, 2, 1]);
  assert.equal(redirects, 1);
});

test('AUTH-LOGIN-003 and AUTH-LOGIN-004 only the domain code starts unknown-user flow', () => {
  assert.equal(isUnknownUserError({ details: { code: 'USER_NOT_FOUND' } }), true);
  assert.equal(isUnknownUserError({ status: 404 }), false);
  assert.equal(isUnknownUserError({ details: { code: 'INVALID_CREDENTIALS' } }), false);
  assert.equal(isUnknownUserError(new TypeError('Network request failed')), false);
});

test('AUTH-LOGIN-005 cancelling countdown prevents a stale redirect', async () => {
  let redirects = 0;
  const countdown = createUnknownUserCountdown({
    tickMs: 5,
    onTick: () => {},
    onComplete: () => { redirects += 1; },
  });
  countdown.start();
  countdown.cancel();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(redirects, 0);
});

test('AUTH-LOGIN-006 duplicate responses share one countdown', async () => {
  let redirects = 0;
  const countdown = createUnknownUserCountdown({
    tickMs: 5,
    onTick: () => {},
    onComplete: () => { redirects += 1; },
  });
  assert.equal(countdown.start(), true);
  assert.equal(countdown.start(), false);
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(redirects, 1);
});
