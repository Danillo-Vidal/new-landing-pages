import { describe, expect, it } from 'vitest';

import {
  addCalendarDays,
  isValidTimeZone,
  parseZonedDateTime,
  startOfZonedDay,
  toZonedCalendarDate,
} from './timezone.ts';

const SP = 'America/Sao_Paulo';

describe('startOfZonedDay', () => {
  it('returns 00:00 in São Paulo (UTC-3) as 03:00 UTC', () => {
    expect(startOfZonedDay({ year: 2026, month: 10, day: 27 }, SP).toISOString()).toBe(
      '2026-10-27T03:00:00.000Z',
    );
  });

  it('handles daylight saving transitions (New York)', () => {
    const ny = 'America/New_York';
    expect(startOfZonedDay({ year: 2026, month: 3, day: 8 }, ny).toISOString()).toBe(
      '2026-03-08T05:00:00.000Z',
    );
    expect(startOfZonedDay({ year: 2026, month: 3, day: 9 }, ny).toISOString()).toBe(
      '2026-03-09T04:00:00.000Z',
    );
  });
});

describe('toZonedCalendarDate', () => {
  it('uses the wall clock of the zone, not UTC', () => {
    // 02:59 UTC on Oct 27 is still Oct 26 in São Paulo.
    expect(toZonedCalendarDate(new Date('2026-10-27T02:59:59Z'), SP)).toEqual({
      year: 2026,
      month: 10,
      day: 26,
    });
  });
});

describe('addCalendarDays', () => {
  it('rolls over months and years', () => {
    expect(addCalendarDays({ year: 2026, month: 10, day: 25 }, 10)).toEqual({
      year: 2026,
      month: 11,
      day: 4,
    });
    expect(addCalendarDays({ year: 2026, month: 12, day: 30 }, 3)).toEqual({
      year: 2027,
      month: 1,
      day: 2,
    });
  });
});

describe('parseZonedDateTime', () => {
  it('reads a date-only value as midnight in the given zone', () => {
    expect(parseZonedDateTime('2026-10-27', SP)?.toISOString()).toBe('2026-10-27T03:00:00.000Z');
  });

  it('reads a full timestamp with explicit offset', () => {
    expect(parseZonedDateTime('2026-10-27T00:00:00-03:00', SP)?.toISOString()).toBe(
      '2026-10-27T03:00:00.000Z',
    );
    expect(parseZonedDateTime('2026-10-27T03:00:00Z', SP)?.toISOString()).toBe(
      '2026-10-27T03:00:00.000Z',
    );
  });

  it.each([
    ['impossible day', '2026-02-30'],
    ['timestamp without offset (ambiguous)', '2026-10-27T00:00:00'],
    ['hour out of range', '2026-10-27T24:00:00-03:00'],
    ['Brazilian format', '27/10/2026'],
    ['empty', ''],
  ])('rejects %s', (_label, value) => {
    expect(parseZonedDateTime(value, SP)).toBeNull();
  });
});

describe('isValidTimeZone', () => {
  it('accepts IANA names and rejects anything else', () => {
    expect(isValidTimeZone(SP)).toBe(true);
    expect(isValidTimeZone('Brasil/Sao Paulo')).toBe(false);
  });
});
