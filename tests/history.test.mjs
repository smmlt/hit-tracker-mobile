import assert from 'node:assert/strict';
import test from 'node:test';
import {
  chooseHistoryDate,
  isDateInSelection,
  presetSelection,
  selectionQuery,
} from '../src/utils/history.js';

test('history presets include today and use calendar-day windows', () => {
  const today = new Date(2026, 8, 13, 12);
  assert.deepEqual(presetSelection('today', today), { start: '2026-09-13', end: '2026-09-13' });
  assert.deepEqual(presetSelection('7', today), { start: '2026-09-07', end: '2026-09-13' });
  assert.deepEqual(presetSelection('30', today), { start: '2026-08-15', end: '2026-09-13' });
});

test('calendar selection progresses from one day to a normalized range', () => {
  assert.deepEqual(chooseHistoryDate({ start: null, end: null }, '2026-09-13'), { start: '2026-09-13', end: null });
  assert.deepEqual(chooseHistoryDate({ start: '2026-09-13', end: null }, '2026-09-07'), { start: '2026-09-07', end: '2026-09-13' });
  assert.deepEqual(chooseHistoryDate({ start: '2026-09-07', end: '2026-09-13' }, '2026-09-10'), { start: '2026-09-10', end: null });
  assert.equal(isDateInSelection('2026-09-11', { start: '2026-09-07', end: '2026-09-13' }), true);
});

test('a single local date produces an exclusive next-day API boundary', () => {
  const query = selectionQuery({ start: '2026-09-13', end: '2026-09-13' });
  assert.equal(new Date(query.to).getTime() - new Date(query.from).getTime(), 24 * 60 * 60 * 1000);
});
