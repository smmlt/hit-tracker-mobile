import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('admin exercise editor preloads and submits displayed likes', () => {
  const editor = source('src/components/admin/ExerciseEditor.js');
  assert.match(editor, /String\(exercise\.likesCount \?\? 0\)/);
  assert.match(editor, /displayedLikesCount: displayedLikesCount === "" \? undefined : Number\(displayedLikesCount\)/);
});

test('official program editor manages displayed likes without exposing it to personal programs', () => {
  const editor = source('src/components/workshop/ProgramEditor.js');
  assert.match(editor, /official \? \{ displayedLikesCount:/);
  assert.match(editor, /\{official && \(\s*<Field\s*label=\{w\.displayedLikes\}/);
});

test('displayed likes label is localized', () => {
  const ui = source('src/components/workshop/ui.js');
  assert.match(ui, /displayedLikes: "Displayed likes"/);
  assert.match(ui, /displayedLikes: "Відображувана кількість вподобань"/);
});
