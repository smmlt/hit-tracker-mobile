export const dateKey = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
);

export const parseDateKey = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};

export const addDays = (date, count) => {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
};

export function presetSelection(preset, today = new Date()) {
  const end = dateKey(today);
  if (preset === 'today') return { start: end, end };
  if (preset === '7') return { start: dateKey(addDays(today, -6)), end };
  if (preset === '30') return { start: dateKey(addDays(today, -29)), end };
  return { start: null, end: null };
}

export function chooseHistoryDate(selection, key) {
  if (!selection.start || selection.end) return { start: key, end: null };
  if (key < selection.start) return { start: key, end: selection.start };
  return { start: selection.start, end: key };
}

export function selectionQuery(selection) {
  if (!selection.start) return {};
  const start = parseDateKey(selection.start);
  start.setHours(0, 0, 0, 0);
  const end = parseDateKey(selection.end || selection.start);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

export const isDateInSelection = (key, selection) => (
  !!selection.start && key >= selection.start && key <= (selection.end || selection.start)
);
