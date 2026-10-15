import { describe, expect, it } from 'vitest';

import { createLesson } from '../test/fixtures.ts';
import { computeJourneyProgress } from './journey-progress.ts';
import { isRewardUnlocked } from './reward.ts';
import type { LessonStatus } from './types.ts';

const fourOpen: LessonStatus[] = ['available', 'available', 'available', 'available', 'ready'];
const fiveOpen: LessonStatus[] = [
  'completed',
  'in_progress',
  'available',
  'available',
  'available',
];
const fourWatched: LessonStatus[] = [
  'completed',
  'completed',
  'completed',
  'completed',
  'available',
];
const fiveWatched: LessonStatus[] = Array<LessonStatus>(5).fill('completed');

describe('isRewardUnlocked', () => {
  it('all_unlocked: needs every lesson open, not watched', () => {
    expect(isRewardUnlocked(fourOpen, 'all_unlocked')).toBe(false);
    expect(isRewardUnlocked(fiveOpen, 'all_unlocked')).toBe(true);
  });

  it('all_watched: needs every lesson completed', () => {
    expect(isRewardUnlocked(fourWatched, 'all_watched')).toBe(false);
    expect(isRewardUnlocked(fiveWatched, 'all_watched')).toBe(true);
  });

  it('never unlocks when disabled', () => {
    expect(isRewardUnlocked(fiveWatched, 'all_unlocked', false)).toBe(false);
  });

  it('does not change the journey progress (total stays 5)', () => {
    const states = fiveOpen.map((status, index) => ({
      lesson: createLesson({ id: `aula-${index + 1}`, order: index + 1 }),
      status,
      releaseAt: null,
      lockReason: null,
    }));
    expect(isRewardUnlocked(fiveOpen, 'all_unlocked')).toBe(true);
    expect(computeJourneyProgress(states)).toMatchObject({ total: 5, released: 5 });
  });
});
