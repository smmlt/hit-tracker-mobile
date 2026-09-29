export function routeSlug(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

export function entityRef(name, id) {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0
    ? `${routeSlug(name)}--${numericId}`
    : routeSlug(name);
}

export function entityId(ref) {
  const match = String(ref ?? '').match(/(?:^|--)(\d+)$/);
  const id = match ? Number(match[1]) : null;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function isoDate(value) {
  const text = typeof value === 'string' ? value : '';
  const prefix = text.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (prefix && !Number.isNaN(new Date(`${prefix}T00:00:00Z`).getTime())) return prefix;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 'unknown-date' : date.toISOString().slice(0, 10);
}
