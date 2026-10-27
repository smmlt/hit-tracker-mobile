import assert from 'node:assert/strict';
import test from 'node:test';
import { planActivityBuckets } from '../src/utils/analyticsActivity.js';

test('omits empty days and keeps partial scheduled completion stacked', () => {
  assert.deepEqual(planActivityBuckets([
    { date: '2026-10-20', plannedWorkouts: 0, completedWorkouts: 3, missedWorkouts: 0 },
    { date: '2026-10-21', plannedWorkouts: 2, completedPlannedWorkouts: 1, missedWorkouts: 1 },
  ], '7'), [
    { date: '2026-10-21', planned: 2, completed: 1, missed: 1 },
  ]);
});

test('groups month periods by week and preserves totals', () => {
  assert.deepEqual(planActivityBuckets([
    { date: '2026-10-19', plannedWorkouts: 1, completedPlannedWorkouts: 1, missedWorkouts: 0 },
    { date: '2026-10-21', plannedWorkouts: 2, completedPlannedWorkouts: 1, missedWorkouts: 1 },
    { date: '2026-10-26', plannedWorkouts: 1, completedPlannedWorkouts: 0, missedWorkouts: 1 },
  ], '3m'), [
    { date: '2026-10-19', planned: 3, completed: 2, missed: 1 },
    { date: '2026-10-26', planned: 1, completed: 0, missed: 1 },
  ]);
});
