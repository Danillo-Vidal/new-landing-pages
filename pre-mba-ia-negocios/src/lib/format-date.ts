const DEFAULT_LOCALE = 'pt-BR';

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(timeZone: string, locale: string): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone,
  });
  formatterCache.set(key, formatter);
  return formatter;
}

/** "27 de out. de 2026" — always rendered in the journey time zone, never the browser's. */
export function formatLongDate(date: Date, timeZone: string, locale = DEFAULT_LOCALE): string {
  return getDateFormatter(timeZone, locale).format(date);
}
