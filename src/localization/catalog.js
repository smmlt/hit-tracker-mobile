// EN: Converts catalog kinds and names into stable translation keys, then falls back to source content when no catalog translation exists.
// UK: Перетворює типи й назви каталогу на стабільні ключі перекладу та повертає вихідний текст, якщо переклад каталогу відсутній.

export function catalogTranslationKey(kind, value) {
  const slug = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug ? `catalog_${kind}_${slug}` : '';
}

export function translateCatalogName(t, kind, value) {
  const key = catalogTranslationKey(kind, value);
  if (!key) return value || '';
  const translated = t(key);
  return translated === key ? value : translated;
}
