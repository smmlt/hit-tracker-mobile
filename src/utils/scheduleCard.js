// EN: Derives schedule-card status, distinguishes late completion, and orders assignments consistently within a day.
// UK: Визначає status картки розкладу, відрізняє пізнє виконання й стабільно сортує призначення всередині дня.
export function scheduleCardTone({ completedAt, scheduledFor, status }) {
  if (status !== 'completed') return status;
  return completedAt?.slice(0, 10) === scheduledFor ? 'completed' : 'completedLate';
}

export function sortScheduleAssignments(assignments) {
  return assignments
    .map((assignment, index) => ({ assignment, index }))
    .sort((left, right) => (
      Number(left.assignment.status === 'completed') - Number(right.assignment.status === 'completed')
      || left.index - right.index
    ))
    .map(({ assignment }) => assignment);
}

export function calendarDaySelection(key, selectedDate, rangeStart, rangeEnd) {
  const selectedOnly = !rangeStart && key === selectedDate;
  const inRange = !!rangeStart && key >= rangeStart && (!rangeEnd ? key === rangeStart : key <= rangeEnd);
  return {
    active: selectedOnly || inRange,
    startsSelection: selectedOnly || key === rangeStart,
    endsSelection: selectedOnly || key === rangeEnd || (key === rangeStart && !rangeEnd),
  };
}
