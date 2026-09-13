import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LOCALE, isSupportedLocale } from '../src/localization/locale.js';
import { translations } from '../src/localization/translations.js';
import { translateCatalogName } from '../src/localization/catalog.js';

test('LOCALIZATION-001 English is the default locale', () => {
  assert.equal(DEFAULT_LOCALE, 'en');
  assert.equal(isSupportedLocale('en'), true);
  assert.equal(isSupportedLocale('uk'), true);
  assert.equal(isSupportedLocale('de'), false);
});

test('LOCALIZATION-002 English and Ukrainian expose the same translation keys', () => {
  assert.deepEqual(Object.keys(translations.uk).sort(), Object.keys(translations.en).sort());
});

test('LOCALIZATION-003 translates official catalog names and preserves custom content', () => {
  const uk = (key) => translations.uk[key] ?? key;
  assert.equal(translateCatalogName(uk, 'muscle', 'Lower Back'), 'Нижня частина спини');
  assert.equal(translateCatalogName(uk, 'exercise', 'Barbell Bench Press'), 'Жим штанги лежачи');
  assert.equal(translateCatalogName(uk, 'program', 'Upper Body Strength'), 'Сила верхньої частини тіла');
  assert.equal(translateCatalogName(uk, 'program', 'HIT Classic Full Body'), 'Класичний HIT на все тіло');
  assert.equal(translateCatalogName(uk, 'program', 'HIT Full Body'), 'HIT на все тіло');
  assert.equal(translateCatalogName(uk, 'exercise', 'Dumbbell Bicep Curl'), 'Згинання рук із гантелями на біцепс');
  assert.equal(translateCatalogName(uk, 'program', 'Bohdan custom plan'), 'Bohdan custom plan');
});
