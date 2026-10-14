import { uiText } from '@/content/ui-text.ts';
import type { LessonState, UnlockTrigger } from '@/domain/types.ts';
import { formatLongDate } from '@/lib/format-date.ts';

interface DescribeOptions {
  readonly timeZone: string;
  readonly trigger: UnlockTrigger;
  /** The previous lesson is open, so this one only waits for the unlock trigger. */
  readonly isPreviousOpen: boolean;
}

/** One-line status shown on a lesson card ("Liberação: 27 de out. de 2026", ...). */
export function describeLessonState(
  state: LessonState,
  { timeZone, trigger, isPreviousOpen }: DescribeOptions,
): string {
  const copy = uiText.lessonCard;
  switch (state.status) {
    case 'locked':
      if (state.lockReason === 'awaiting_previous_lesson') {
        return isPreviousOpen ? copy.awaitingTrigger[trigger] : copy.awaitingPreviousLesson;
      }
      return state.releaseAt
        ? copy.releaseOn(formatLongDate(state.releaseAt, timeZone))
        : copy.awaitingEnrollment;
    case 'ready':
      return copy.readyHint;
    case 'available':
      return copy.availableHint;
    case 'in_progress':
      return copy.inProgressHint;
    case 'completed':
      return copy.completedHint;
  }
}
