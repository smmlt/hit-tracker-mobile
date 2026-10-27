// EN: Proves the production contract for supported locale defaults, bilingual key parity, and official/custom catalog-name translation; fixtures model user-visible behavior and integration boundaries rather than implementation details.
// UK: Перевіряє робочий контракт типової мови, однакових ключів у двох мовах і перекладу офіційних та власних назв каталогу; фікстури відтворюють поведінку користувача й межі інтеграції, а не деталі реалізації.

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LOCALE, LOCALE_OPTIONS, SUPPORTED_LOCALES, isSupportedLocale } from '../src/localization/locale.js';
import { translations } from '../src/localization/translations.js';
import { localizeCatalogEntity, translateCatalogName } from '../src/localization/catalog.js';

test('LOCALIZATION-001 English is the default locale', () => {
  assert.equal(DEFAULT_LOCALE, 'en');
  assert.equal(isSupportedLocale('en'), true);
  assert.equal(isSupportedLocale('uk'), true);
  assert.equal(isSupportedLocale('de'), false);
  assert.deepEqual(LOCALE_OPTIONS.map(({ value }) => value), SUPPORTED_LOCALES);
  assert.deepEqual(LOCALE_OPTIONS.map(({ flag }) => flag), ['gb', 'ua']);
});

test('LOCALIZATION-004 selects saved text and video with English fallback', () => {
  const entity = {
    name: 'Plank',
    description: 'English legacy',
    videoUrl: 'https://youtube.com/en-legacy',
    translations: [
      { locale: 'en', name: 'Plank', description: 'English text', videoUrl: 'https://youtube.com/en' },
      { locale: 'uk', name: 'Планка', description: 'Український текст', videoUrl: 'https://youtube.com/uk' },
    ],
  };
  const t = (key) => key;
  assert.equal(localizeCatalogEntity(entity, 'uk', t, 'exercise').displayName, 'Планка');
  assert.equal(localizeCatalogEntity(entity, 'uk', t, 'exercise').displayVideoUrl, 'https://youtube.com/uk');
  assert.equal(localizeCatalogEntity(entity, 'de', t, 'exercise').displayDescription, 'English text');
  assert.equal(localizeCatalogEntity({ ...entity, isPersonal: true }, 'uk', t, 'program', true).name, 'Plank');
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

test('LOCALIZATION-005 translates every muscle used by the normalized catalog', () => {
  const uk = (key) => translations.uk[key] ?? key;
  const muscles = [
    'Chest', 'Triceps', 'Shoulders', 'Core', 'Back', 'Serratus Anterior',
    'Biceps', 'Forearms', 'Trapezius', 'Spinal Erectors', 'Glutes',
    'Hamstrings', 'Brachialis', 'Wrist Flexors', 'Wrist Extensors',
    'Hip Flexors', 'Quadriceps', 'Calves', 'Soleus',
  ];
  for (const muscle of muscles) {
    assert.notEqual(translateCatalogName(uk, 'muscle', muscle), muscle, muscle);
  }
});
