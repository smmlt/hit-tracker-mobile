import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('exercise editor keeps required equipment separate from alternatives', () => {
  const editor = fs.readFileSync(new URL('../src/components/admin/ExerciseEditor.js', import.meta.url), 'utf8');
  assert.match(editor, /equipmentStructured: \{ required, alternatives \}/);
  assert.match(editor, /alternativeEquipment[\s\S]*?\.split\("\\n"\)/);
  assert.match(editor, /line\.split\(\/\[\|\/\]\//);
  assert.match(editor, /new Set\(\[\.\.\.required, \.\.\.alternatives\.flat\(\)\]\)/);
});
