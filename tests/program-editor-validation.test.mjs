import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const editor = fs.readFileSync(
  new URL('../src/components/workshop/ProgramEditor.js', import.meta.url),
  'utf8',
);

test('program editor validates only the target matching the exercise measurement type', () => {
  assert.match(editor, /row\.measurementType === "duration"\s*\?/);
  assert.doesNotMatch(editor, /row\.measurementType === "reps"[^;]+&&\s*\(row\.measurementType === "duration"/s);
});
