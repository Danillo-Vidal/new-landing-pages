import { addCalendarDays, startOfZonedDay, toZonedCalendarDate } from '../lib/timezone.ts';
import type { AccessContext, LockReason, ReleaseRule } from './types.ts';

export interface ReleaseDecision {
  readonly isReleased: boolean;
  readonly releaseAt: Date | null;
  readonly lockReason: LockReason | null;
}

/** Strategy pattern: each release rule knows how to decide if a lesson is open. */
export interface ReleaseStrategy {
  evaluate(context: AccessContext): ReleaseDecision;
}

function decide(releaseAt: Date, now: Date): ReleaseDecision {
  const isReleased = now.getTime() >= releaseAt.getTime();
  return { isReleased, releaseAt, lockReason: isReleased ? null : 'awaiting_release_date' };
}

/** Phase 1: the lesson opens for everyone at the same instant. */
export class FixedDateStrategy implements ReleaseStrategy {
  private readonly releaseAt: Date;

  constructor(releaseAt: Date) {
    this.releaseAt = releaseAt;
  }

  evaluate({ now }: AccessContext): ReleaseDecision {
    return decide(this.releaseAt, now);
  }
}

/**
 * Phase 2: the lesson opens N calendar days after the learner's enrollment, at 00:00 of
 * that day in the journey time zone (enrolled on Oct 13 + 10 days → opens Oct 23, 00:00).
 * Without an enrollment date (static mode) the lesson stays locked.
 */
export class EnrollmentOffsetStrategy implements ReleaseStrategy {
  private readonly days: number;
  private readonly timeZone: string;

  constructor(days: number, timeZone: string) {
    this.days = days;
    this.timeZone = timeZone;
  }

  evaluate({ now, enrollmentDate }: AccessContext): ReleaseDecision {
    if (enrollmentDate === null) {
      return { isReleased: false, releaseAt: null, lockReason: 'awaiting_enrollment' };
    }
    const enrollmentDay = toZonedCalendarDate(enrollmentDate, this.timeZone);
    const releaseDay = addCalendarDays(enrollmentDay, this.days);
    return decide(startOfZonedDay(releaseDay, this.timeZone), now);
  }
}

/**
 * Progress-based release: the first lesson is always open; the others open when the learner
 * unlocks them, which is only allowed while the previous lesson is open (see lesson-status.ts).
 */
export class SequentialStrategy implements ReleaseStrategy {
  private readonly isOpen: boolean;

  constructor(isOpen: boolean) {
    this.isOpen = isOpen;
  }

  evaluate(): ReleaseDecision {
    return this.isOpen
      ? { isReleased: true, releaseAt: null, lockReason: null }
      : { isReleased: false, releaseAt: null, lockReason: 'awaiting_previous_lesson' };
  }
}

/** Sequence facts needed by `SequentialStrategy` (ignored by date-based rules). */
export interface SequenceContext {
  readonly isOpen: boolean;
}

export function createReleaseStrategy(
  rule: ReleaseRule,
  timeZone: string,
  sequence: SequenceContext = { isOpen: false },
): ReleaseStrategy {
  switch (rule.type) {
    case 'fixed_date':
      return new FixedDateStrategy(rule.date);
    case 'enrollment_offset':
      return new EnrollmentOffsetStrategy(rule.days, timeZone);
    case 'sequential':
      return new SequentialStrategy(sequence.isOpen);
  }
}
