import assert from 'node:assert/strict';
import test from 'node:test';

import { responsiveLayout } from '../src/constants/layout.js';

test('responsive layout classifies narrow phones, tablets, and desktop windows', () => {
  assert.deepEqual(responsiveLayout(320), { compact: true, desktop: false, horizontalPadding: 12 });
  assert.deepEqual(responsiveLayout(440), { compact: true, desktop: false, horizontalPadding: 16 });
  assert.deepEqual(responsiveLayout(768), { compact: false, desktop: false, horizontalPadding: 24 });
  assert.deepEqual(responsiveLayout(1440), { compact: false, desktop: true, horizontalPadding: 24 });
});

test('responsive layout uses a safe compact fallback for invalid widths', () => {
  assert.equal(responsiveLayout(0).compact, true);
  assert.equal(responsiveLayout(Number.NaN).compact, true);
});
