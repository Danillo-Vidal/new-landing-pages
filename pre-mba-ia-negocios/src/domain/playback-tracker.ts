import type { LessonCompletion, LessonProgress, PlaybackMode } from './types.ts';

/**
 * Pure watched-time bookkeeping. Every function receives `nowMs` from the injected Clock and
 * returns the SAME object when nothing changes, so callers can skip re-renders and writes.
 */

export const EMPTY_LESSON_PROGRESS: LessonProgress = {
  unlocked: false,
  playStartedAt: null,
  accumulatedMs: 0,
  completion: null,
};

export function hasStartedPlayback(progress: LessonProgress): boolean {
  return (
    progress.completion !== null || progress.playStartedAt !== null || progress.accumulatedMs > 0
  );
}

export function isCountingPlayback(progress: LessonProgress): boolean {
  return progress.completion === null && progress.playStartedAt !== null;
}

export function computeWatchedMs(progress: LessonProgress, nowMs: number): number {
  const openSegment =
    progress.playStartedAt === null ? 0 : Math.max(0, nowMs - progress.playStartedAt);
  return progress.accumulatedMs + openSegment;
}

export function requiredWatchMs(durationMs: number, threshold: number): number {
  return Math.round(durationMs * threshold);
}

export function isWatchComplete(watchedMs: number, durationMs: number, threshold: number): boolean {
  return watchedMs >= requiredWatchMs(durationMs, threshold);
}

/** Play: opens a segment. In wallclock mode the first play keeps counting until completion. */
export function startPlayback(progress: LessonProgress, nowMs: number): LessonProgress {
  if (progress.completion !== null || progress.playStartedAt !== null) return progress;
  return { ...progress, playStartedAt: nowMs };
}

/** Pause / player closed: closes the segment. Ignored in wallclock mode. */
export function pausePlayback(
  progress: LessonProgress,
  nowMs: number,
  mode: PlaybackMode,
): LessonProgress {
  if (mode === 'wallclock' || progress.playStartedAt === null) return progress;
  return { ...progress, accumulatedMs: computeWatchedMs(progress, nowMs), playStartedAt: null };
}

/** Moves the open segment into `accumulatedMs`, so a reload loses at most one tick. */
export function checkpointPlayback(progress: LessonProgress, nowMs: number): LessonProgress {
  if (!isCountingPlayback(progress)) return progress;
  return { ...progress, accumulatedMs: computeWatchedMs(progress, nowMs), playStartedAt: nowMs };
}

/** Drops an open segment without counting it (the player always reloads paused). */
export function interruptPlayback(progress: LessonProgress): LessonProgress {
  return progress.playStartedAt === null ? progress : { ...progress, playStartedAt: null };
}

/** `true` when the open segment has reached `duration × threshold`. */
export function shouldCompleteByTime(
  progress: LessonProgress,
  nowMs: number,
  durationMs: number | null,
  threshold: number,
): boolean {
  if (durationMs === null || !isCountingPlayback(progress)) return false;
  return isWatchComplete(computeWatchedMs(progress, nowMs), durationMs, threshold);
}

export function completeLesson(
  progress: LessonProgress,
  nowMs: number,
  completion: LessonCompletion,
): LessonProgress {
  if (progress.completion !== null) return progress;
  return {
    ...progress,
    accumulatedMs: computeWatchedMs(progress, nowMs),
    playStartedAt: null,
    completion,
  };
}

/** "Desmarcar": the lesson goes back to "not started". */
export function uncompleteLesson(progress: LessonProgress): LessonProgress {
  if (progress.completion === null) return progress;
  return { ...progress, completion: null, accumulatedMs: 0, playStartedAt: null };
}

export function unlockLessonProgress(progress: LessonProgress): LessonProgress {
  return progress.unlocked ? progress : { ...progress, unlocked: true };
}
