const pad = (value) => String(value).padStart(2, '0');

export function defaultSuspensionInput(now = new Date()) {
  const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())} ${pad(next.getHours())}:${pad(next.getMinutes())}`;
}

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
