// EN: Formats workout durations for the live timer and human-readable summaries.
// UK: Форматує тривалість тренування для live timer і зрозумілих підсумків.
// src/utils/formatters.js

/** EN: Formats elapsed seconds as MM:SS or HH:MM:SS for the live workout timer. UK: Форматує минулі секунди як MM:SS або HH:MM:SS для таймера активного тренування. */
export function formatTimer(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '00:00:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  /** EN: Pads one timer component to two digits. UK: Доповнює одну частину таймера до двох цифр. */
  const pad = (num) => String(num).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/** EN: Formats elapsed seconds as a compact Ukrainian hours/minutes/seconds history label. UK: Форматує минулі секунди як стислий український підпис годин, хвилин і секунд для історії. */
export function formatDurationHuman(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0 сек';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} год`);
  if (minutes > 0) parts.push(`${minutes} хв`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} сек`);

  return parts.join(' ');
}
