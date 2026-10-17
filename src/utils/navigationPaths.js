// EN: Builds normalized route slugs and id-bearing entity references used by share links and deep-link parsing.
// UK: Будує нормалізовані route slugs і references сутностей з ID для share links та deep-link parsing.
/** EN: Normalizes arbitrary display text into a non-empty URL-safe route slug. UK: Нормалізує довільний відображуваний текст у непорожню безпечну для URL частину маршруту. */
export function routeSlug(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

/** EN: Combines a readable name slug with a valid positive numeric identifier when one exists. UK: Поєднує читабельну назву маршруту з коректним додатним числовим ідентифікатором, якщо він є. */
export function entityRef(name, id) {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0
    ? `${routeSlug(name)}--${numericId}`
    : routeSlug(name);
}

/** EN: Extracts and validates the trailing numeric identifier from a shared entity reference. UK: Витягує та перевіряє кінцевий числовий ідентифікатор із поширеного посилання на сутність. */
export function entityId(ref) {
  const match = String(ref ?? '').match(/(?:^|--)(\d+)$/);
  const id = match ? Number(match[1]) : null;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** EN: Returns a stable YYYY-MM-DD value from an ISO prefix or parseable date, with a safe fallback. UK: Повертає стабільне значення YYYY-MM-DD з ISO-префікса або дати, яку можна розібрати, із безпечним запасним значенням. */
export function isoDate(value) {
  const text = typeof value === 'string' ? value : '';
  const prefix = text.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (prefix && !Number.isNaN(new Date(`${prefix}T00:00:00Z`).getTime())) return prefix;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 'unknown-date' : date.toISOString().slice(0, 10);
}
