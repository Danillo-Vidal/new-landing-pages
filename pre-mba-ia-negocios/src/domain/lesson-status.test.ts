import { describe, expect, it } from 'vitest';

import { loadCourse } from '../content/load-course.ts';
import { at, createContext, createLesson, SAO_PAULO } from '../test/fixtures.ts';
import {
  canUnlockLesson,
  getNextReleaseAt,
  isLessonSelectable,
  type PreviousLesson,
  resolveLessonStates,
  resolveLessonStatus,
} from './lesson-status.ts';
import { EMPTY_LESSON_PROGRESS } from './playback-tracker.ts';
import type { Course, JourneyProgressRecord, LessonProgress, LessonState } from './types.ts';

const completion = { completedAt: '2026-10-14T12:00:00.000Z', source: 'video' as const };
const progress = (overrides: Partial<LessonProgress> = {}): LessonProgress => ({
  ...EMPTY_LESSON_PROGRESS,
  ...overrides,
});

function resolveDated(lessonProgress: LessonProgress, now: Date) {
  return resolveLessonStatus({
    lesson: createLesson({ release: { type: 'fixed_date', date: at('2026-10-20') } }),
    context: createContext({ now }),
    progress: lessonProgress,
    previous: null,
    trigger: 'play',
    timeZone: SAO_PAULO,
  });
}

describe('resolveLessonStatus — date-based lessons', () => {
  it('is locked before the release date', () => {
    const state = resolveDated(progress(), at('2026-10-19T23:59:59-03:00'));
    expect(state.status).toBe('locked');
    expect(state.lockReason).toBe('awaiting_release_date');
    expect(state.releaseAt?.toISOString()).toBe(at('2026-10-20').toISOString());
  });

  it('is available once released, in progress once played, completed once watched', () => {
    const now = at('2026-10-20');
    expect(resolveDated(progress(), now).status).toBe('available');
    expect(resolveDated(progress({ accumulatedMs: 5_000 }), now).status).toBe('in_progress');
    expect(resolveDated(progress({ completion }), now).status).toBe('completed');
  });

  it('keeps a lesson locked even if it was watched before its date was postponed', () => {
    expect(resolveDated(progress({ completion }), at('2026-10-15')).status).toBe('locked');
  });

  it('locks enrollment-based lessons with a specific reason in static mode', () => {
    const state = resolveLessonStatus({
      lesson: createLesson({ release: { type: 'enrollment_offset', days: 10 } }),
      context: createContext({ enrollmentDate: null }),
      progress: EMPTY_LESSON_PROGRESS,
      previous: null,
      trigger: 'play',
      timeZone: SAO_PAULO,
    });
    expect(state).toMatchObject({
      status: 'locked',
      releaseAt: null,
      lockReason: 'awaiting_enrollment',
    });
    expect(isLessonSelectable(state)).toBe(false);
  });
});

function previousWith(
  status: LessonState['status'],
  lessonProgress: LessonProgress,
): PreviousLesson {
  return {
    state: { lesson: createLesson(), status, releaseAt: null, lockReason: null },
    progress: lessonProgress,
  };
}

describe('canUnlockLesson', () => {
  it('trigger "play": the previous lesson only needs to be started', () => {
    expect(canUnlockLesson(previousWith('available', progress()), 'play')).toBe(false);
    expect(
      canUnlockLesson(previousWith('in_progress', progress({ playStartedAt: 0 })), 'play'),
    ).toBe(true);
    expect(
      canUnlockLesson(previousWith('in_progress', progress({ accumulatedMs: 3_000 })), 'play'),
    ).toBe(true);
    expect(canUnlockLesson(previousWith('completed', progress({ completion })), 'play')).toBe(true);
  });

  it('trigger "watched": the previous lesson must be completed', () => {
    expect(
      canUnlockLesson(previousWith('in_progress', progress({ playStartedAt: 0 })), 'watched'),
    ).toBe(false);
    expect(canUnlockLesson(previousWith('completed', progress({ completion })), 'watched')).toBe(
      true,
    );
  });

  it('never unlocks after a locked/ready lesson or for the first lesson', () => {
    expect(canUnlockLesson(previousWith('locked', progress({ playStartedAt: 0 })), 'play')).toBe(
      false,
    );
    expect(canUnlockLesson(previousWith('ready', progress({ playStartedAt: 0 })), 'play')).toBe(
      false,
    );
    expect(canUnlockLesson(null, 'play')).toBe(false);
  });
});

describe('course.json — sequential release', () => {
  const result = loadCourse();
  if (!result.ok) throw new Error('course.json must be valid for this test');
  // The real content may lock lessons ("em breve"); these tests cover the sequential rule itself.
  const course: Course = {
    ...result.course,
    lessons: result.course.lessons.map((lesson) => ({
      ...lesson,
      release: { type: 'sequential' as const },
    })),
  };
  const context = createContext();
  const statusesOf = (record: JourneyProgressRecord, trigger = course.progression.unlockNextOn) =>
    resolveLessonStates({ ...course, progression: { unlockNextOn: trigger } }, context, record).map(
      (state) => state.status,
    );

  it('first visit: lesson 1 open, the others locked', () => {
    expect(statusesOf({})).toEqual(['available', 'locked', 'locked', 'locked', 'locked']);
  });

  it('"play" on lesson 1 makes lesson 2 ready; unlocking opens it', () => {
    const played = { 'aula-1': progress({ playStartedAt: 0 }) };
    expect(statusesOf(played, 'play')).toEqual([
      'in_progress',
      'ready',
      'locked',
      'locked',
      'locked',
    ]);
    expect(statusesOf({ ...played, 'aula-2': progress({ unlocked: true }) }, 'play')).toEqual([
      'in_progress',
      'available',
      'locked',
      'locked',
      'locked',
    ]);
  });

  it('"watched" only makes lesson 2 ready once lesson 1 is completed', () => {
    expect(statusesOf({ 'aula-1': progress({ playStartedAt: 0 }) }, 'watched')[1]).toBe('locked');
    expect(statusesOf({ 'aula-1': progress({ completion }) }, 'watched')[1]).toBe('ready');
  });

  it('never opens a lesson out of order (lesson 3 saved as unlocked, lesson 2 locked)', () => {
    expect(statusesOf({ 'aula-3': progress({ unlocked: true, completion }) })).toEqual([
      'available',
      'locked',
      'locked',
      'locked',
      'locked',
    ]);
  });

  it('has no date-based refresh to schedule', () => {
    const states = resolveLessonStates(course, context, {});
    expect(getNextReleaseAt(states, context.now)).toBeNull();
  });
});

describe('manual lock ("locked")', () => {
  const result = loadCourse();
  if (!result.ok) throw new Error('course.json must be valid for this test');
  const [first, second, ...rest] = result.course.lessons;
  if (!first || !second) throw new Error('course.json must have at least two lessons');
  const course: Course = {
    ...result.course,
    progression: { unlockNextOn: 'play' },
    lessons: [
      { ...first, release: { type: 'sequential' } },
      { ...second, release: { type: 'locked' } },
      ...rest.map((lesson) => ({ ...lesson, release: { type: 'sequential' as const } })),
    ],
  };
  const statesOf = (record: JourneyProgressRecord) =>
    resolveLessonStates(course, createContext(), record);

  it('never offers "Liberar aula" for a locked lesson, even after playing the previous one', () => {
    const states = statesOf({ 'aula-1': progress({ playStartedAt: 0 }) });
    expect(states[1]).toMatchObject({ status: 'locked', lockReason: 'awaiting_publication' });
  });

  it('keeps it locked even if the learner had unlocked or watched it before', () => {
    const states = statesOf({
      'aula-1': progress({ completion }),
      'aula-2': progress({ unlocked: true, completion }),
    });
    expect(states[1]?.status).toBe('locked');
    expect(states.slice(2).every((state) => state.status === 'locked')).toBe(true);
  });

  it('restores the saved progress once the rule goes back to "sequential"', () => {
    const reopened: Course = {
      ...course,
      lessons: course.lessons.map((lesson) => ({
        ...lesson,
        release: { type: 'sequential' as const },
      })),
    };
    const states = resolveLessonStates(reopened, createContext(), {
      'aula-1': progress({ completion }),
      'aula-2': progress({ unlocked: true, completion }),
    });
    expect(states[1]?.status).toBe('completed');
  });
});
