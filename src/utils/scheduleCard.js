// EN: Derives schedule-card status, distinguishes late completion, and orders assignments consistently within a day.
// UK: Визначає status картки розкладу, відрізняє пізнє виконання й стабільно сортує призначення всередині дня.
/** EN: Maps an assignment to its visual status and distinguishes completion on a later calendar day. UK: Перетворює призначення на його візуальний стан і відрізняє завершення в пізніший календарний день. */
export function scheduleCardTone({ completedAt, scheduledFor, status }) {
  if (status !== 'completed') return status;
  return completedAt?.slice(0, 10) === scheduledFor ? 'completed' : 'completedLate';
}

/** EN: Keeps unfinished assignments before completed ones while preserving stable order inside both groups. UK: Розміщує незавершені призначення перед завершеними, зберігаючи стабільний порядок усередині обох груп. */
export function sortScheduleAssignments(assignments) {
  return assignments
    .map(/* EN: Captures each original index for a deterministic stable-order fallback. UK: Зберігає початковий індекс кожного елемента для детермінованого стабільного порядку. */ (assignment, index) => ({ assignment, index }))
    .sort(/* EN: Orders unfinished work first and otherwise compares original positions. UK: Сортує незавершені елементи першими, а решту — за початковими позиціями. */ (left, right) => (
      Number(left.assignment.status === 'completed') - Number(right.assignment.status === 'completed')
      || left.index - right.index
    ))
    .map(/* EN: Removes the temporary index wrapper after sorting. UK: Вилучає тимчасову обгортку з індексом після сортування. */ ({ assignment }) => assignment);
}

/** EN: Derives active, start, and end flags for one calendar cell in a single-date or range selection. UK: Визначає ознаки активної, початкової та кінцевої клітинки календаря для вибору однієї дати або діапазону. */
export function calendarDaySelection(key, selectedDate, rangeStart, rangeEnd) {
  const selectedOnly = !rangeStart && key === selectedDate;
  const inRange = !!rangeStart && key >= rangeStart && (!rangeEnd ? key === rangeStart : key <= rangeEnd);
  return {
    active: selectedOnly || inRange,
    startsSelection: selectedOnly || key === rangeStart,
    endsSelection: selectedOnly || key === rangeEnd || (key === rangeStart && !rangeEnd),
  };
}
