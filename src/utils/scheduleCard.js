export function scheduleCardTone({ completedAt, scheduledFor, status }) {
  if (status !== 'completed') return status;
  return completedAt?.slice(0, 10) === scheduledFor ? 'completed' : 'completedLate';
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
