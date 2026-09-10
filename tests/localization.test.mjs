import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LOCALE, isSupportedLocale } from '../src/localization/locale.js';
import { translations } from '../src/localization/translations.js';

test('LOCALIZATION-001 English is the default locale', () => {
  assert.equal(DEFAULT_LOCALE, 'en');
  assert.equal(isSupportedLocale('en'), true);
  assert.equal(isSupportedLocale('uk'), true);
  assert.equal(isSupportedLocale('de'), false);
});

test('LOCALIZATION-002 English and Ukrainian expose the same translation keys', () => {
  assert.deepEqual(Object.keys(translations.uk).sort(), Object.keys(translations.en).sort());
});
