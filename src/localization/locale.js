// EN: Defines the default English locale, the supported English/Ukrainian set, and the predicate used to reject unsupported values.
// UK: Визначає типову англійську мову, набір підтримуваних англійської/української мов і перевірку непідтримуваних значень.

export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = ['en', 'uk'];

export const isSupportedLocale = (locale) => SUPPORTED_LOCALES.includes(locale);
