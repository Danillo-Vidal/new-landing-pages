import type { LessonStatus, RewardUnlockRule } from './types.ts';

function isOpenStatus(status: LessonStatus): boolean {
  return status === 'available' || status === 'in_progress' || status === 'completed';
}

/**
 * The reward card is DERIVED from the lesson statuses (never stored):
 * - `all_unlocked` → every lesson is open (watching is not required);
 * - `all_watched`  → every lesson is completed.
 */
export function isRewardUnlocked(
  statuses: readonly LessonStatus[],
  rule: RewardUnlockRule,
  enabled = true,
): boolean {
  if (!enabled || statuses.length === 0) return false;
  return rule === 'all_watched'
    ? statuses.every((status) => status === 'completed')
    : statuses.every(isOpenStatus);
}
