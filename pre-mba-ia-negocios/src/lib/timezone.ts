/**
 * Time-zone helpers built only on `Intl` (no date library).
 *
 * Why: release dates are defined in the journey time zone (America/Sao_Paulo), but the
 * learner's browser may run in any zone. Every conversion between "calendar day in the
 * journey zone" and "absolute instant" must go through these helpers.
 *
 * NOTE: pure module (no React, no `@/` alias, explicit `.ts` extensions) so Node tooling such
 * as vite.config can load it. See docs/ARCHITECTURE.md › "Import rules".
 */

/** A wall-clock calendar day. `month` is 1-12. */
export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const MS_PER_DAY = 86_400_000;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_WITH_OFFSET_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

function readParts(instant: Date, timeZone: string): Record<string, number> {
  const parts: Record<string, number> = {};
  for (const part of getPartsFormatter(timeZone).formatToParts(instant)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return parts;
}

/** Offset (ms) between the zone's wall clock and UTC at a given instant. */
function getZoneOffsetMs(instant: Date, timeZone: string): number {
  const p = readParts(instant, timeZone);
  const wallClockAsUtc = Date.UTC(
    p.year ?? 0,
    (p.month ?? 1) - 1,
    p.day ?? 1,
    p.hour ?? 0,
    p.minute ?? 0,
    p.second ?? 0,
  );
  const instantWithoutMs = instant.getTime() - instant.getUTCMilliseconds();
  return wallClockAsUtc - instantWithoutMs;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    getPartsFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

export function isValidCalendarDate({ year, month, day }: CalendarDate): boolean {
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

/** Calendar day of `instant` as seen on a wall clock in `timeZone`. */
export function toZonedCalendarDate(instant: Date, timeZone: string): CalendarDate {
  const p = readParts(instant, timeZone);
  return { year: p.year ?? 0, month: p.month ?? 1, day: p.day ?? 1 };
}

/** Absolute instant of 00:00 of `date` in `timeZone` (DST-safe: offset is re-checked). */
export function startOfZonedDay(date: CalendarDate, timeZone: string): Date {
  const wallClockAsUtc = Date.UTC(date.year, date.month - 1, date.day);
  const firstGuess = wallClockAsUtc - getZoneOffsetMs(new Date(wallClockAsUtc), timeZone);
  const correctedOffset = getZoneOffsetMs(new Date(firstGuess), timeZone);
  return new Date(wallClockAsUtc - correctedOffset);
}

export function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day) + days * MS_PER_DAY);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/**
 * Parses the date formats accepted in course.json and in `?today=`:
 * - `"2026-10-27"` → 00:00 of that day in `timeZone`;
 * - `"2026-10-27T00:00:00-03:00"` → exact instant (an explicit offset is mandatory).
 * Returns `null` for anything else, including impossible dates such as 2026-02-30.
 */
export function parseZonedDateTime(value: string, timeZone: string): Date | null {
  const trimmed = value.trim();

  const dateOnly = DATE_ONLY_PATTERN.exec(trimmed);
  if (dateOnly) {
    const date = {
      year: Number(dateOnly[1]),
      month: Number(dateOnly[2]),
      day: Number(dateOnly[3]),
    };
    return isValidCalendarDate(date) ? startOfZonedDay(date, timeZone) : null;
  }

  const dateTime = DATE_TIME_WITH_OFFSET_PATTERN.exec(trimmed);
  if (!dateTime) return null;
  const date = { year: Number(dateTime[1]), month: Number(dateTime[2]), day: Number(dateTime[3]) };
  const hours = Number(dateTime[4]);
  const minutes = Number(dateTime[5]);
  const seconds = Number(dateTime[6] ?? '0');
  if (!isValidCalendarDate(date) || hours > 23 || minutes > 59 || seconds > 59) return null;

  const timestamp = Date.parse(trimmed);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}
