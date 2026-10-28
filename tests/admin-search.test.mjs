// EN: Proves the admin user search applies reactively without replacing its controlled input.
// UK: Перевіряє реактивний пошук користувачів адміністратора без заміни контрольованого поля.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/screens/AdminScreen.js', import.meta.url), 'utf8');

test('admin user search debounces trimmed input and ignores stale responses', () => {
  assert.match(source, /useRef/);
  assert.match(source, /setTimeout\([\s\S]*setSearch\(query\.trim\(\)\), 350\)/);
  assert.match(source, /clearTimeout\(timeout\)/);
  assert.match(source, /onChangeText=\{setQuery\}/);
  assert.match(source, /onSubmitEditing=[\s\S]*setSearch\(query\.trim\(\)\)/);
  assert.doesNotMatch(source, /<Button onPress=[\s\S]*setSearch\(query\.trim\(\)\)/);
  assert.match(source, /const requestId = \+\+userRequestId\.current/);
  assert.match(source, /if \(requestId !== userRequestId\.current\) return;/);
});
