import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createUsernameAvailabilityController,
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  validateUsername,
} from '../src/utils/username.js';

test('PROFILE-USERNAME-006 validates and normalizes the username contract', () => {
  assert.deepEqual(validateUsername(' User._Name '), {
    valid: true,
    username: 'user._name',
    reason: null,
  });
  for (const value of ['abc', '_ab', 'ab_', 'a__b', 'a._b', 'a_.b']) {
    assert.equal(validateUsername(value).valid, true, value);
  }
  for (const value of [
    'a'.repeat(MIN_USERNAME_LENGTH - 1),
    'a'.repeat(MAX_USERNAME_LENGTH + 1),
    'user-name',
    'користувач',
    '.user',
    'user.',
    'user..name',
  ]) {
    assert.equal(validateUsername(value).valid, false, value);
  }
});

test('PROFILE-USERNAME-003 debounces checks without discarding the latest value', async () => {
  const checked = [];
  const states = [];
  const controller = createUsernameAvailabilityController({
    delay: 10,
    check: async (username) => {
      checked.push(username);
      return { available: true };
    },
    onState: (state) => states.push(state),
  });

  controller.update('first_name');
  controller.update('second_name');
  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.deepEqual(checked, ['second_name']);
  assert.equal(states.at(-1).status, 'available');
  assert.equal(states.at(-1).username, 'second_name');
  controller.dispose();
});

test('PROFILE-USERNAME-004 ignores an older out-of-order response', async () => {
  const pending = new Map();
  const states = [];
  const controller = createUsernameAvailabilityController({
    delay: 5,
    check: (username) => new Promise((resolve) => pending.set(username, resolve)),
    onState: (state) => states.push(state),
  });

  controller.update('first_name');
  await new Promise((resolve) => setTimeout(resolve, 10));
  controller.update('second_name');
  await new Promise((resolve) => setTimeout(resolve, 10));
  pending.get('second_name')({ available: true });
  await Promise.resolve();
  pending.get('first_name')({ available: false });
  await Promise.resolve();

  assert.equal(states.at(-1).status, 'available');
  assert.equal(states.at(-1).username, 'second_name');
  controller.dispose();
});

test('PROFILE-USERNAME-001 reports an available username after the backend check', async () => {
  const states = [];
  const controller = createUsernameAvailabilityController({
    delay: 5,
    check: async () => ({ available: true }),
    onState: (state) => states.push(state),
  });
  controller.update('available_name');
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(states.at(-1).status, 'available');
  controller.dispose();
});

test('PROFILE-USERNAME-002 keeps the checked value when it is taken', async () => {
  const states = [];
  const controller = createUsernameAvailabilityController({
    delay: 5,
    check: async () => ({ available: false }),
    onState: (state) => states.push(state),
  });
  controller.update('taken_name');
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(states.at(-1), {
    status: 'taken',
    username: 'taken_name',
    reason: 'taken',
  });
  controller.dispose();
});

test('PROFILE-USERNAME-005 final-save conflict returns to taken state', () => {
  const states = [];
  const controller = createUsernameAvailabilityController({
    check: async () => ({ available: true }),
    onState: (state) => states.push(state),
  });
  controller.markTaken('Race_Name');
  assert.deepEqual(states.at(-1), {
    status: 'taken',
    username: 'race_name',
    reason: 'taken',
  });
  controller.dispose();
});
