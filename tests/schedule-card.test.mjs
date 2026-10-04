import assert from 'node:assert/strict';
import test from 'node:test';
import { calendarDaySelection, scheduleCardTone, sortScheduleAssignments } from '../src/utils/scheduleCard.js';

test('scheduled program cards distinguish same-day and late completions', () => {
  assert.equal(scheduleCardTone({ status: 'planned', scheduledFor: '2026-09-13' }), 'planned');
  assert.equal(scheduleCardTone({ status: 'missed', scheduledFor: '2026-09-12' }), 'missed');
  assert.equal(scheduleCardTone({ status: 'completed', scheduledFor: '2026-09-13', completedAt: '2026-09-13T17:30:00.000Z' }), 'completed');
  assert.equal(scheduleCardTone({ status: 'completed', scheduledFor: '2026-09-13', completedAt: '2026-09-14T17:30:00.000Z' }), 'completedLate');
});

test('scheduled programs stay above completed programs while preserving each group order', () => {
  const assignments = [
    { id: 1, status: 'completed', completedAt: '2026-09-13T17:30:00.000Z' },
    { id: 2, status: 'planned' },
    { id: 3, status: 'completed', completedAt: '2026-09-14T17:30:00.000Z' },
    { id: 4, status: 'missed' },
  ];

  assert.deepEqual(sortScheduleAssignments(assignments).map(({ id }) => id), [2, 4, 1, 3]);
});

test('calendar mirrors a date selected from the horizontal chips', () => {
  assert.deepEqual(
    calendarDaySelection('2026-09-15', '2026-09-15', null, null),
    { active: true, startsSelection: true, endsSelection: true },
  );
  assert.equal(calendarDaySelection('2026-09-14', '2026-09-15', null, null).active, false);
});
