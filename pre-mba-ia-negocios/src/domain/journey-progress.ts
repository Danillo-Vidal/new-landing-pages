import { isLessonSelectable } from './lesson-status.ts';
import type { JourneyProgress, LessonState } from './types.ts';

function toPercent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

export function computeJourneyProgress(states: readonly LessonState[]): JourneyProgress {
  const total = states.length;
  const released = states.filter(isLessonSelectable).length;
  const completed = states.filter((state) => state.status === 'completed').length;

  return {
    total,
    released,
    completed,
    releasedPct: toPercent(released, total),
    completedPct: toPercent(completed, total),
  };
}
