import { isLessonSelectable } from './lesson-status.ts';
import type { LessonId, LessonState } from './types.ts';

/**
 * Lesson opened on page load: the most recent released lesson not watched yet.
 * If every released lesson is completed, falls back to the most recent released one.
 * Returns `null` when nothing is released.
 */
export function pickInitialLessonId(states: readonly LessonState[]): LessonId | null {
  const released = states.filter(isLessonSelectable);
  const latestPending = released.findLast((state) => state.status !== 'completed');
  return (latestPending ?? released.at(-1))?.lesson.id ?? null;
}
