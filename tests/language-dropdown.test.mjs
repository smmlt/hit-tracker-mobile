// EN: Verifies that the language dropdown stays anchored, content-sized, and scroll-bounded across viewport sizes.
// UK: Перевіряє, що dropdown мов залишається прив'язаним, відповідає вмісту й обмежує прокрутку на різних екранах.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { languageMenuLayout } from '../src/utils/languageDropdown.js';

test('language menu matches its trigger without taking the full desktop width', () => {
  const layout = languageMenuLayout({
    anchor: { x: 100, y: 120, width: 360, height: 48 },
    optionCount: 2,
    viewportHeight: 900,
    viewportWidth: 1440,
  });
  assert.equal(layout.width, 360);
  assert.equal(layout.left, 100);
  assert.equal(layout.top, 174);
});

test('language menu opens upward and caps height when many options do not fit below', () => {
  const layout = languageMenuLayout({
    anchor: { x: 16, y: 700, width: 320, height: 48 },
    optionCount: 20,
    viewportHeight: 800,
    viewportWidth: 360,
  });
  assert.equal(layout.width, 320);
  assert.equal(layout.maxHeight, 320);
  assert.equal(layout.top, 374);
});

test('language menu remains inside a narrow phone viewport', () => {
  const layout = languageMenuLayout({
    anchor: { x: 4, y: 80, width: 300, height: 48 },
    optionCount: 2,
    viewportHeight: 480,
    viewportWidth: 280,
  });
  assert.equal(layout.left, 12);
  assert.equal(layout.width, 256);
  assert.ok(layout.top >= 12);
});
