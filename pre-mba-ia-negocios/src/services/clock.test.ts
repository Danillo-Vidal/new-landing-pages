import { describe, expect, it, vi } from 'vitest';

import { createFixedClock, createScaledClock, createShiftedClock, resolveClock } from './clock.ts';

const SP = 'America/Sao_Paulo';
const realNow = new Date('2026-10-14T15:00:00.000Z');

describe('createShiftedClock', () => {
  it('starts at the given instant and keeps ticking with the base clock', () => {
    let current = realNow.getTime();
    const base = { now: () => new Date(current) };
    const clock = createShiftedClock(base, new Date('2026-10-27T03:00:00.000Z'));

    expect(clock.now().toISOString()).toBe('2026-10-27T03:00:00.000Z');
    current += 5_000;
    expect(clock.now().toISOString()).toBe('2026-10-27T03:00:05.000Z');
  });
});

describe('createScaledClock (?speed= simulator)', () => {
  it('runs N times faster and stays continuous across reloads with the same speed', () => {
    let current = realNow.getTime();
    const base = { now: () => new Date(current) };
    const firstVisit = createScaledClock(base, 60);
    const before = firstVisit.now().getTime();
    current += 1_000;
    expect(firstVisit.now().getTime() - before).toBe(60_000);

    const afterReload = createScaledClock(base, 60);
    expect(afterReload.now().getTime()).toBe(firstVisit.now().getTime());
  });

  it('is enabled by ?speed= only when overrides are allowed', () => {
    const base = createFixedClock(realNow);
    const options = {
      search: '?speed=60',
      paramName: 'today',
      speedParamName: 'speed',
      timeZone: SP,
      base,
    };
    expect(resolveClock({ ...options, allowOverride: false }).clock).toBe(base);
    expect(resolveClock({ ...options, allowOverride: true }).clock).not.toBe(base);
  });
});

describe('resolveClock (?today= simulator)', () => {
  const base = createFixedClock(realNow);

  it('simulates midnight of the given day in the journey time zone', () => {
    const { clock, simulatedStart } = resolveClock({
      search: '?today=2026-11-03',
      paramName: 'today',
      allowOverride: true,
      timeZone: SP,
      base,
    });
    expect(simulatedStart?.toISOString()).toBe('2026-11-03T03:00:00.000Z');
    expect(clock.now().toISOString()).toBe('2026-11-03T03:00:00.000Z');
  });

  it('ignores the parameter when the feature flag is off (production)', () => {
    const resolved = resolveClock({
      search: '?today=2026-11-03',
      paramName: 'today',
      allowOverride: false,
      timeZone: SP,
      base,
    });
    expect(resolved.simulatedStart).toBeNull();
    expect(resolved.clock.now().toISOString()).toBe(realNow.toISOString());
  });

  it('ignores invalid dates with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const resolved = resolveClock({
      search: '?today=31/12/2026',
      paramName: 'today',
      allowOverride: true,
      timeZone: SP,
      base,
    });
    expect(resolved.simulatedStart).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });
});
