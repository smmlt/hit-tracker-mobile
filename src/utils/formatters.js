// src/utils/formatters.js

// ⏱️ Формат для живого таймера (00:00:00)
export function formatTimer(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '00:00:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num) => String(num).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

// 📜 Формат для Історії тренувань (1 год 15 хв 3 сек)
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