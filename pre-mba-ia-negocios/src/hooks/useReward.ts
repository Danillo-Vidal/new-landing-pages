import { useCallback, useState } from 'react';

import { isRewardUnlocked } from '@/domain/reward.ts';
import type { LessonStatus, Reward } from '@/domain/types.ts';

export interface RewardView {
  /** The card is in the DOM. */
  readonly isVisible: boolean;
  /** Mounted under the "Aula liberada!" overlay, still invisible (layout already switched). */
  readonly isAwaitingReveal: boolean;
  /** Entrance animation running (only on a false → true transition during the visit). */
  readonly isRevealing: boolean;
  /** Revealed during this visit (drives the one-off screen-reader announcement). */
  readonly wasRevealed: boolean;
  readonly endReveal: () => void;
}

/**
 * Reward card state, DERIVED from the lesson statuses (nothing is persisted).
 * Loading the page with the condition already true shows the card ready, without animation.
 */
export function useReward(
  statuses: readonly LessonStatus[],
  reward: Reward,
  isPreparingReveal: boolean,
): RewardView {
  const isUnlocked = isRewardUnlocked(statuses, reward.unlockWhen, reward.enabled);
  const [previousUnlocked, setPreviousUnlocked] = useState(isUnlocked);
  const [isRevealing, setIsRevealing] = useState(false);
  const [wasRevealed, setWasRevealed] = useState(false);

  // Transition detected during render (React's pattern for state derived from new props).
  if (isUnlocked !== previousUnlocked) {
    setPreviousUnlocked(isUnlocked);
    setIsRevealing(isUnlocked);
    setWasRevealed(isUnlocked);
  }

  const endReveal = useCallback(() => {
    setIsRevealing(false);
  }, []);

  return {
    isVisible: isUnlocked || (reward.enabled && isPreparingReveal),
    isAwaitingReveal: !isUnlocked && reward.enabled && isPreparingReveal,
    isRevealing,
    wasRevealed,
    endReveal,
  };
}
