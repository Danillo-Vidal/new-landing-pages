import { parseZonedDateTime } from '@/lib/timezone.ts';

/**
 * The ONLY source of "now" in the app. Never call `new Date()` / `Date.now()` elsewhere
 * (ESLint enforces it): injecting a Clock makes dates testable and simulable.
 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

/** Frozen clock — handy for tests. */
export function createFixedClock(instant: Date): Clock {
  const timestamp = instant.getTime();
  return { now: () => new Date(timestamp) };
}

/**
 * Clock that starts at `startAt` and keeps ticking in real time. Used by the date simulator
 * (so testers can watch a lesson unlock live) and, in phase 2, to follow the server time.
 */
export function createShiftedClock(base: Clock, startAt: Date): Clock {
  const offsetMs = startAt.getTime() - base.now().getTime();
  return { now: () => new Date(base.now().getTime() + offsetMs) };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Clock that runs `speed` times faster than `base` (`?speed=60`: one real second counts as one
 * minute). Lets testers watch a lesson be completed without waiting the whole video. Anchored
 * at the start of the current UTC day, so reloading with the same speed keeps a continuous time.
 */
export function createScaledClock(base: Clock, speed: number): Clock {
  const anchor = Math.floor(base.now().getTime() / DAY_MS) * DAY_MS;
  return { now: () => new Date(anchor + (base.now().getTime() - anchor) * speed) };
}

const MAX_SPEED = 3600;

interface ResolveClockOptions {
  /** `window.location.search`. */
  readonly search: string;
  /** Query parameter name, e.g. "today". */
  readonly paramName: string;
  /** Query parameter that speeds the clock up, e.g. "speed" (same feature flag as `paramName`). */
  readonly speedParamName?: string;
  /** Feature flag `features.allowDateOverride` (off in production by default). */
  readonly allowOverride: boolean;
  /** Journey time zone: `?today=2026-10-27` means 00:00 of that day in this zone. */
  readonly timeZone: string;
  readonly base?: Clock;
}

export interface ResolvedClock {
  readonly clock: Clock;
  /** Simulated starting instant, or `null` when the real time is used. */
  readonly simulatedStart: Date | null;
}

export function resolveClock({
  search,
  paramName,
  speedParamName,
  allowOverride,
  timeZone,
  base = systemClock,
}: ResolveClockOptions): ResolvedClock {
  const params = new URLSearchParams(search);
  const speed = allowOverride && speedParamName ? Number(params.get(speedParamName)) : 1;
  const speedClock =
    Number.isFinite(speed) && speed > 1 && speed <= MAX_SPEED
      ? createScaledClock(base, speed)
      : base;
  return resolveDateOverride({ params, paramName, allowOverride, timeZone, base: speedClock });
}

function resolveDateOverride({
  params,
  paramName,
  allowOverride,
  timeZone,
  base,
}: Omit<ResolveClockOptions, 'search' | 'speedParamName'> & {
  readonly params: URLSearchParams;
  readonly base: Clock;
}): ResolvedClock {
  const rawValue = allowOverride ? params.get(paramName) : null;
  if (!rawValue) return { clock: base, simulatedStart: null };

  const simulatedStart = parseZonedDateTime(rawValue, timeZone);
  if (simulatedStart === null) {
    console.warn(`[clock] Ignorando ?${paramName}=${rawValue}: use AAAA-MM-DD.`);
    return { clock: base, simulatedStart: null };
  }
  return { clock: createShiftedClock(base, simulatedStart), simulatedStart };
}
