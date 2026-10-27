const normalized = (value) => String(value || '').trim().toLocaleLowerCase();
const aliases = (value) => Array.isArray(value)
  ? value
  : Object.values(value || {}).flat().filter(Boolean);

export function matchesCatalogQuery(item, query) {
  const needle = normalized(query);
  if (!needle) return true;
  const values = [
    item?.name,
    item?.displayName,
    ...aliases(item?.aliases),
    ...(item?.translations || []).flatMap((translation) => [
      translation?.name,
      ...aliases(translation?.aliases),
    ]),
  ];
  return values.some((value) => normalized(value).includes(needle));
}
