import { describe, expect, it } from 'vitest';

import { createLesson } from '../test/fixtures.ts';
import { pickInitialLessonId } from './lesson-selection.ts';
import type { LessonState, LessonStatus } from './types.ts';

function statesFrom(statuses: LessonStatus[]): LessonState[] {
  return statuses.map((status, index) => ({
    lesson: createLesson({ id: `aula-${index + 1}`, order: index + 1 }),
    status,
    releaseAt: null,
    lockReason: null,
  }));
}

describe('pickInitialLessonId', () => {
  it('opens the most recent released lesson that is not completed', () => {
    expect(pickInitialLessonId(statesFrom(['completed', 'available', 'available', 'locked']))).toBe(
      'aula-3',
    );
  });

  it('skips completed lessons to find a pending one', () => {
    expect(pickInitialLessonId(statesFrom(['available', 'completed', 'locked']))).toBe('aula-1');
  });

  it('falls back to the most recent released lesson when all are completed', () => {
    expect(pickInitialLessonId(statesFrom(['completed', 'completed', 'locked']))).toBe('aula-2');
  });

  it('treats an in-progress lesson as pending and ignores ready (not unlocked) lessons', () => {
    expect(pickInitialLessonId(statesFrom(['completed', 'in_progress', 'ready', 'locked']))).toBe(
      'aula-2',
    );
  });

  it('returns null when nothing is released', () => {
    expect(pickInitialLessonId(statesFrom(['locked', 'locked']))).toBeNull();
  });
});
