import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Admin header switches to a stacked layout on narrow screens', () => {
  const screen = readFileSync(new URL('../src/screens/AdminScreen.js', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../src/screens/AdminScreen.styles.js', import.meta.url), 'utf8');

  assert.match(screen, /const compactLayout = width < 600/);
  assert.match(screen, /compactLayout && styles\.compactTop/);
  assert.match(screen, /compactLayout && styles\.compactTopActions/);
  assert.match(styles, /compactTop:[\s\S]*flexDirection: "column"/);
  assert.match(styles, /compactTopActions:[\s\S]*width: "100%"/);
});
