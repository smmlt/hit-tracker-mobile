import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getPasswordCriteria, isValidPassword } from '../src/utils/validation.js';

test('AUTH-PASSWORD-001 requires the same five password rules during registration', () => {
  assert.deepEqual(getPasswordCriteria('StrongPassword1!'), {
    minLength: true,
    hasNumber: true,
    hasUpper: true,
    hasLower: true,
    hasSpecial: true,
  });
  assert.equal(isValidPassword('StrongPassword1!'), true);

  for (const password of [
    'Short1!',
    'strongpassword1!',
    'STRONGPASSWORD1!',
    'StrongPassword!!',
    'StrongPassword12',
  ]) {
    assert.equal(isValidPassword(password), false, password);
  }
});
