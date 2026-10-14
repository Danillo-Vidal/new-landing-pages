/** Converts player time into a 0-1 ratio, tolerating unknown/invalid durations. */
export function toProgressRatio(currentTimeSeconds: number, durationSeconds: number): number {
  if (!Number.isFinite(currentTimeSeconds) || !Number.isFinite(durationSeconds)) return 0;
  if (durationSeconds <= 0) return 0;
  return Math.min(Math.max(currentTimeSeconds / durationSeconds, 0), 1);
}

/** A lesson counts as watched once the player reports at least `threshold` (e.g. 0.9). */
export function hasReachedCompletion(progressRatio: number, threshold: number): boolean {
  return Number.isFinite(progressRatio) && progressRatio >= threshold;
}
