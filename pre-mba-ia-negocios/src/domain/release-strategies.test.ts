import { describe, expect, it } from 'vitest';

import { at, createContext, SAO_PAULO } from '../test/fixtures.ts';
import {
  createReleaseStrategy,
  EnrollmentOffsetStrategy,
  FixedDateStrategy,
  SequentialStrategy,
} from './release-strategies.ts';

const ONE_MS = 1;

describe('FixedDateStrategy', () => {
  const releaseAt = at('2026-10-27T00:00:00-03:00');
  const strategy = new FixedDateStrategy(releaseAt);

  it('keeps the lesson locked before the release instant', () => {
    const decision = strategy.evaluate(
      createContext({ now: new Date(releaseAt.getTime() - ONE_MS) }),
    );
    expect(decision).toEqual({ isReleased: false, releaseAt, lockReason: 'awaiting_release_date' });
  });

  it('releases exactly at the release instant (boundary is inclusive)', () => {
    expect(strategy.evaluate(createContext({ now: releaseAt })).isReleased).toBe(true);
  });

  it('stays released after the release instant', () => {
    const decision = strategy.evaluate(createContext({ now: at('2026-12-01') }));
    expect(decision).toEqual({ isReleased: true, releaseAt, lockReason: null });
  });

  it('respects the São Paulo time zone regardless of UTC date', () => {
    // 23:59:59 on Oct 26 in São Paulo is already Oct 27 in UTC.
    const lateNight = new Date('2026-10-27T02:59:59Z');
    expect(strategy.evaluate(createContext({ now: lateNight })).isReleased).toBe(false);
    expect(
      strategy.evaluate(createContext({ now: new Date('2026-10-27T03:00:00Z') })).isReleased,
    ).toBe(true);
  });
});

describe('EnrollmentOffsetStrategy', () => {
  const strategy = new EnrollmentOffsetStrategy(10, SAO_PAULO);

  it('stays locked without an enrollment date (static mode)', () => {
    expect(strategy.evaluate(createContext({ enrollmentDate: null }))).toEqual({
      isReleased: false,
      releaseAt: null,
      lockReason: 'awaiting_enrollment',
    });
  });

  it('releases at 00:00 (São Paulo) of enrollment day + N days', () => {
    const enrollmentDate = at('2026-10-13T15:30:00-03:00');
    const releaseAt = at('2026-10-23');

    const before = strategy.evaluate(
      createContext({ enrollmentDate, now: new Date(releaseAt.getTime() - ONE_MS) }),
    );
    expect(before).toEqual({ isReleased: false, releaseAt, lockReason: 'awaiting_release_date' });

    const exactly = strategy.evaluate(createContext({ enrollmentDate, now: releaseAt }));
    expect(exactly).toEqual({ isReleased: true, releaseAt, lockReason: null });
  });

  it('counts days from the enrollment day in the journey time zone, not in UTC', () => {
    // 23:30 in São Paulo on Oct 13 is already Oct 14 in UTC.
    const enrollmentDate = at('2026-10-13T23:30:00-03:00');
    const decision = new EnrollmentOffsetStrategy(1, SAO_PAULO).evaluate(
      createContext({ enrollmentDate, now: enrollmentDate }),
    );
    expect(decision.releaseAt?.toISOString()).toBe(at('2026-10-14').toISOString());
  });

  it('releases on enrollment day when the offset is 0', () => {
    const enrollmentDate = at('2026-10-13T09:00:00-03:00');
    const decision = new EnrollmentOffsetStrategy(0, SAO_PAULO).evaluate(
      createContext({ enrollmentDate, now: enrollmentDate }),
    );
    expect(decision.isReleased).toBe(true);
  });
});

describe('SequentialStrategy', () => {
  it('opens only when the sequence says so, regardless of dates', () => {
    expect(new SequentialStrategy(true).evaluate()).toEqual({
      isReleased: true,
      releaseAt: null,
      lockReason: null,
    });
    expect(new SequentialStrategy(false).evaluate()).toEqual({
      isReleased: false,
      releaseAt: null,
      lockReason: 'awaiting_previous_lesson',
    });
  });
});

describe('createReleaseStrategy', () => {
  it('maps each release rule to its strategy', () => {
    expect(
      createReleaseStrategy({ type: 'fixed_date', date: at('2026-10-13') }, SAO_PAULO),
    ).toBeInstanceOf(FixedDateStrategy);
    expect(createReleaseStrategy({ type: 'enrollment_offset', days: 3 }, SAO_PAULO)).toBeInstanceOf(
      EnrollmentOffsetStrategy,
    );
    expect(
      createReleaseStrategy({ type: 'sequential' }, SAO_PAULO, { isOpen: true }),
    ).toBeInstanceOf(SequentialStrategy);
  });
});
