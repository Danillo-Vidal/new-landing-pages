import { describe, expect, it } from 'vitest';

import { parseDuration } from './duration.ts';

describe('parseDuration', () => {
  it('parses mm:ss and h:mm:ss', () => {
    expect(parseDuration('12:30')).toBe(750_000);
    expect(parseDuration('0:45')).toBe(45_000);
    expect(parseDuration('1:02:03')).toBe(3_723_000);
    expect(parseDuration(' 90:00 ')).toBe(5_400_000);
  });

  it.each(['', '12', 'abc', '12:60', '1:2:3', '1:60:00', '-1:00', '0:00', '12:30:00:00'])(
    'rejects "%s"',
    (text) => {
      expect(parseDuration(text)).toBeNull();
    },
  );
});
