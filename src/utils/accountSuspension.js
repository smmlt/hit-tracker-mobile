// EN: Creates, parses, validates, and formats moderator account-suspension timestamps in the local date-time input format.
// UK: Створює, парсить, перевіряє й форматує moderator timestamps блокування акаунта у локальному форматі date-time input.
/** EN: Pads one local date-time component to two digits. UK: Доповнює одну частину локальної дати й часу до двох цифр. */
const pad = (value) => String(value).padStart(2, '0');

/** EN: Produces a local suspension input default exactly 24 hours after the supplied time. UK: Формує початкове локальне значення блокування рівно через 24 години після заданого часу. */
export function defaultSuspensionInput(now = new Date()) {
  const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())} ${pad(next.getHours())}:${pad(next.getMinutes())}`;
}

/** EN: Strictly parses a future local suspension input and converts it to an ISO timestamp. UK: Суворо розбирає майбутній локальний час блокування та перетворює його на ISO-час. */
export function suspensionInputToIso(value, now = new Date()) {
  const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date <= now
  ) return null;
  return date.toISOString();
}

/** EN: Accepts only a live ACCOUNT_BANNED payload and reduces it to safe persistable suspension details. UK: Приймає лише чинні дані ACCOUNT_BANNED і зводить їх до безпечних для збереження відомостей про блокування. */
export function normalizeAccountSuspension(details) {
  if (details?.code !== 'ACCOUNT_BANNED') return null;
  const expiresAt = new Date(details.expiresAt);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date()) return null;
  return {
    code: 'ACCOUNT_BANNED',
    expiresAt: expiresAt.toISOString(),
    reason: typeof details.reason === 'string' && details.reason.trim() ? details.reason.trim() : null,
  };
}
