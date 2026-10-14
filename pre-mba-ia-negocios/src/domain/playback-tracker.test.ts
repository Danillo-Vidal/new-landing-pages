import { describe, expect, it } from 'vitest';

import {
  checkpointPlayback,
  completeLesson,
  computeWatchedMs,
  EMPTY_LESSON_PROGRESS,
  interruptPlayback,
  isWatchComplete,
  pausePlayback,
  shouldCompleteByTime,
  startPlayback,
  uncompleteLesson,
} from './playback-tracker.ts';

const SECOND = 1000;
const completion = { completedAt: '2026-10-14T12:00:00.000Z', source: 'video' as const };

describe('computeWatchedMs', () => {
  it('playing-time: counts only while playing (play, pause, resume)', () => {
    let progress = startPlayback(EMPTY_LESSON_PROGRESS, 0);
    progress = pausePlayback(progress, 10 * SECOND, 'playing-time');
    expect(computeWatchedMs(progress, 15 * SECOND)).toBe(10 * SECOND);
    progress = startPlayback(progress, 20 * SECOND);
    expect(computeWatchedMs(progress, 30 * SECOND)).toBe(20 * SECOND);
  });

  it('wallclock: pause is ignored, counts the elapsed time since the first play', () => {
    let progress = startPlayback(EMPTY_LESSON_PROGRESS, 0);
    progress = pausePlayback(progress, 10 * SECOND, 'wallclock');
    progress = startPlayback(progress, 20 * SECOND);
    expect(computeWatchedMs(progress, 30 * SECOND)).toBe(30 * SECOND);
  });

  it('checkpoint keeps the total; interrupting drops only the open segment', () => {
    const playing = { ...startPlayback(EMPTY_LESSON_PROGRESS, 0), accumulatedMs: 5 * SECOND };
    const checkpointed = checkpointPlayback(playing, 10 * SECOND);
    expect(computeWatchedMs(checkpointed, 12 * SECOND)).toBe(
      computeWatchedMs(playing, 12 * SECOND),
    );
    expect(computeWatchedMs(interruptPlayback(checkpointed), 99 * SECOND)).toBe(15 * SECOND);
  });

  it('never counts negative time (timestamp ahead of the clock)', () => {
    expect(computeWatchedMs(startPlayback(EMPTY_LESSON_PROGRESS, 50 * SECOND), 0)).toBe(0);
  });
});

describe('completion threshold', () => {
  const duration = 750 * SECOND; // "12:30" → 11:15 with 0.9

  it('completes exactly at duration × threshold', () => {
    expect(isWatchComplete(675 * SECOND - 1, duration, 0.9)).toBe(false);
    expect(isWatchComplete(675 * SECOND, duration, 0.9)).toBe(true);
    const playing = startPlayback(EMPTY_LESSON_PROGRESS, 0);
    expect(shouldCompleteByTime(playing, 675 * SECOND - 1, duration, 0.9)).toBe(false);
    expect(shouldCompleteByTime(playing, 675 * SECOND, duration, 0.9)).toBe(true);
  });

  it('never completes by time without a configured duration', () => {
    const playing = startPlayback(EMPTY_LESSON_PROGRESS, 0);
    expect(shouldCompleteByTime(playing, 10_000 * SECOND, null, 0.9)).toBe(false);
  });

  it('completing closes the segment; "Desmarcar" resets the watched time', () => {
    const done = completeLesson(startPlayback(EMPTY_LESSON_PROGRESS, 0), 675 * SECOND, completion);
    expect(done).toEqual({
      unlocked: false,
      playStartedAt: null,
      accumulatedMs: 675 * SECOND,
      completion,
    });
    expect(startPlayback(done, 700 * SECOND)).toBe(done);
    expect(uncompleteLesson(done)).toEqual(EMPTY_LESSON_PROGRESS);
  });
});
