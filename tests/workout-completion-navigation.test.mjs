// EN: Guards the completed-workout choices between creating a new program and opening an existing Workshop match.
// UK: Захищає вибір після завершення тренування між створенням нової програми та відкриттям знайденої програми в Майстерні.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const screen = readFileSync(
  new URL('../src/screens/ActiveWorkoutScreen.js', import.meta.url),
  'utf8',
);
const translations = readFileSync(
  new URL('../src/localization/translations.js', import.meta.url),
  'utf8',
);

test('a matching program opens its existing Workshop details route', () => {
  assert.match(screen, /matchedProgram\.isPersonal \? 'matchingPersonalProgram' : 'matchingPublicProgram'/);
  assert.match(screen, /tabs\.navigate\('Home', \{\s*screen: 'LibraryProgram'/);
  assert.match(screen, /programRef: entityRef\(programName, programId\)/);
  assert.match(screen, /matchedProgram \? t\('viewProgram'\) : t\('yes'\)/);
});

test('matching-program guidance is localized in English and Ukrainian', () => {
  assert.match(translations, /matchingPersonalProgram: 'You already have/);
  assert.match(translations, /matchingPublicProgram: '“\{name\}” in the Workshop/);
  assert.match(translations, /matchingPersonalProgram: 'У вас уже є програма/);
  assert.match(translations, /matchingPublicProgram: 'У Майстерні є програма/);
});
