import { describe, expect, it } from 'vitest';

import { createLesson } from '../test/fixtures.ts';
import { computeJourneyProgress } from './journey-progress.ts';
import type { LessonState, LessonStatus } from './types.ts';

function statesFrom(statuses: LessonStatus[]): LessonState[] {
  return statuses.map((status, index) => ({
    lesson: createLesson({ id: `aula-${index + 1}`, order: index + 1 }),
    status,
    releaseAt: null,
    lockReason: status === 'locked' ? 'awaiting_release_date' : null,
  }));
}

describe('computeJourneyProgress', () => {
  it('counts released and completed lessons', () => {
    expect(
      computeJourneyProgress(
        statesFrom(['completed', 'available', 'available', 'locked', 'locked']),
      ),
    ).toEqual({ total: 5, released: 3, completed: 1, releasedPct: 60, completedPct: 20 });
  });

  it('counts in-progress lessons as released and ready lessons as not released yet', () => {
    expect(
      computeJourneyProgress(statesFrom(['completed', 'in_progress', 'ready', 'locked'])),
    ).toMatchObject({ released: 2, completed: 1 });
  });

  it('rounds percentages', () => {
    expect(computeJourneyProgress(statesFrom(['completed', 'locked', 'locked']))).toMatchObject({
      releasedPct: 33,
      completedPct: 33,
    });
  });

  it('returns zeros for an empty journey', () => {
    expect(computeJourneyProgress([])).toEqual({
      total: 0,
      released: 0,
      completed: 0,
      releasedPct: 0,
      completedPct: 0,
    });
  });

  it('reaches 100% when everything is watched', () => {
    expect(computeJourneyProgress(statesFrom(['completed', 'completed']))).toMatchObject({
      releasedPct: 100,
      completedPct: 100,
    });
  });
});
