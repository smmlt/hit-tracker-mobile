import assert from 'node:assert/strict';
import test from 'node:test';
import { planActivityBuckets, planActivityPages } from '../src/utils/analyticsActivity.js';

test('omits empty days and keeps partial scheduled completion stacked', () => {
  assert.deepEqual(planActivityBuckets([
    { date: '2026-10-20', plannedWorkouts: 0, completedWorkouts: 3, missedWorkouts: 0 },
    { date: '2026-10-21', plannedWorkouts: 2, completedPlannedWorkouts: 1, missedWorkouts: 1 },
  ], '7'), [
    { date: '2026-10-21', planned: 2, completed: 1, missed: 1 },
  ]);
});

test('keeps active dates separate for long periods', () => {
  assert.deepEqual(planActivityBuckets([
    { date: '2026-10-19', plannedWorkouts: 1, completedPlannedWorkouts: 1, missedWorkouts: 0 },
    { date: '2026-10-21', plannedWorkouts: 2, completedPlannedWorkouts: 1, missedWorkouts: 1 },
    { date: '2026-10-26', plannedWorkouts: 1, completedPlannedWorkouts: 0, missedWorkouts: 1 },
  ]), [
    { date: '2026-10-19', planned: 1, completed: 1, missed: 0 },
    { date: '2026-10-21', planned: 2, completed: 1, missed: 1 },
    { date: '2026-10-26', planned: 1, completed: 0, missed: 1 },
  ]);
});

test('paginates active dates into stable seven-column windows', () => {
  const activity = Array.from({ length: 15 }, (_, index) => ({ date: `2026-10-${String(index + 1).padStart(2, '0')}` }));
  assert.deepEqual(planActivityPages(activity).map((page) => page.length), [1, 7, 7]);
  assert.equal(planActivityPages(activity).at(-1)[0].date, '2026-10-09');
  assert.equal(planActivityPages(activity).at(-1).at(-1).date, '2026-10-15');
});
