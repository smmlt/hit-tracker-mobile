import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('exercise editor persists image provenance with the exercise', () => {
  const editor = fs.readFileSync(new URL('../src/components/admin/ExerciseEditor.js', import.meta.url), 'utf8');
  for (const field of [
    'demonstrationImageSourceUrl',
    'demonstrationImageAuthor',
    'demonstrationImageLicense',
    'demonstrationImageLicenseUrl',
  ]) {
    assert.match(editor, new RegExp(field));
  }
});
