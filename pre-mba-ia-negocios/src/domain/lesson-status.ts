import { EMPTY_LESSON_PROGRESS, hasStartedPlayback } from './playback-tracker.ts';
import { createReleaseStrategy } from './release-strategies.ts';
import type {
  AccessContext,
  Course,
  JourneyProgressRecord,
  Lesson,
  LessonProgress,
  LessonState,
  UnlockTrigger,
} from './types.ts';

/** The lesson right before the one being resolved (by `order`). */
export interface PreviousLesson {
  readonly state: LessonState;
  readonly progress: LessonProgress;
}

interface ResolveLessonStatusInput {
  readonly lesson: Lesson;
  readonly context: AccessContext;
  readonly progress: LessonProgress;
  /** `null` for the first lesson of the journey. */
  readonly previous: PreviousLesson | null;
  readonly trigger: UnlockTrigger;
  readonly timeZone: string;
}

export function isLessonSelectable(state: LessonState): boolean {
  return state.status !== 'locked' && state.status !== 'ready';
}

/**
 * A sequential lesson can be unlocked once the previous one is open and reached the trigger:
 * `play` → its video was started; `watched` → it was completed.
 */
export function canUnlockLesson(previous: PreviousLesson | null, trigger: UnlockTrigger): boolean {
  if (previous === null || !isLessonSelectable(previous.state)) return false;
  if (trigger === 'watched') return previous.state.status === 'completed';
  return hasStartedPlayback(previous.progress);
}

/**
 * Business rule for a single lesson:
 * - `locked`      → release moment not reached (wins over "completed", e.g. a postponed date);
 * - `ready`       → sequential lesson the learner may unlock now;
 * - `completed`   → released and watched;
 * - `in_progress` → released and video started;
 * - `available`   → released and not started.
 *
 * A sequential lesson saved as unlocked while the previous one is not open stays locked
 * (inconsistent or tampered storage never opens lessons out of order).
 */
export function resolveLessonStatus({
  lesson,
  context,
  progress,
  previous,
  trigger,
  timeZone,
}: ResolveLessonStatusInput): LessonState {
  const isOpen = previous === null || (progress.unlocked && isLessonSelectable(previous.state));
  const decision = createReleaseStrategy(lesson.release, timeZone, { isOpen }).evaluate(context);

  if (!decision.isReleased) {
    if (lesson.release.type === 'sequential' && canUnlockLesson(previous, trigger)) {
      return { lesson, status: 'ready', releaseAt: null, lockReason: null };
    }
    return {
      lesson,
      status: 'locked',
      releaseAt: decision.releaseAt,
      lockReason: decision.lockReason,
    };
  }

  const status =
    progress.completion !== null
      ? 'completed'
      : hasStartedPlayback(progress)
        ? 'in_progress'
        : 'available';
  return { lesson, status, releaseAt: decision.releaseAt, lockReason: null };
}

export function resolveLessonStates(
  course: Course,
  context: AccessContext,
  record: JourneyProgressRecord,
): LessonState[] {
  const timeZone = course.journey.timezone;
  const trigger = course.progression.unlockNextOn;
  const states: LessonState[] = [];
  let previous: PreviousLesson | null = null;

  for (const lesson of course.lessons) {
    const progress = record[lesson.id] ?? EMPTY_LESSON_PROGRESS;
    const state = resolveLessonStatus({ lesson, context, progress, previous, trigger, timeZone });
    states.push(state);
    previous = { state, progress };
  }
  return states;
}

/** Earliest future release instant, used to refresh the page exactly when a lesson opens. */
export function getNextReleaseAt(states: readonly LessonState[], now: Date): Date | null {
  let next: Date | null = null;
  for (const { status, releaseAt } of states) {
    if (status !== 'locked' || releaseAt === null || releaseAt.getTime() <= now.getTime()) continue;
    if (next === null || releaseAt.getTime() < next.getTime()) next = releaseAt;
  }
  return next;
}
