import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Workshop exposes a localized Favorites chip before muscle filters', () => {
  const screen = readFileSync(new URL('../src/screens/HomeScreen.js', import.meta.url), 'utf8');
  const words = readFileSync(new URL('../src/components/workshop/ui.js', import.meta.url), 'utf8');
  const filter = readFileSync(new URL('../src/components/exercise/ExerciseFilterBar.js', import.meta.url), 'utf8');

  assert.match(screen, /savedSelected=\{section === 'exercises' && scope === 'saved'\}/);
  assert.match(screen, /savedLabel=\{w\.favorites\}/);
  assert.match(screen, /setScope\(scope === 'saved' \? 'all' : 'saved'\)/);
  assert.match(filter, /renderChip\('saved'[\s\S]*renderChip\(\s*null/);
  assert.match(words, /favorites: "Favorites"/);
  assert.match(words, /favorites: "Обрані"/);
});
