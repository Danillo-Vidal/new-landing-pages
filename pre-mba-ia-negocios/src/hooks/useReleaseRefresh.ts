import { useEffect, useEffectEvent } from 'react';

/** Re-check at least hourly: protects against laptop sleep and timer throttling. */
const MAX_TIMER_DELAY_MS = 60 * 60 * 1000;
/** Small margin so the refreshed clock is safely past the release instant. */
const RELEASE_GRACE_MS = 250;

/**
 * Calls `onDue` when the next lesson release is reached while the page is open, and when the
 * tab becomes visible again. A single `setTimeout` — no polling loop.
 */
export function useReleaseRefresh(nextReleaseAt: Date | null, now: Date | null, onDue: () => void) {
  const handleDue = useEffectEvent(onDue);
  const nextReleaseTime = nextReleaseAt?.getTime() ?? null;
  const nowTime = now?.getTime() ?? null;

  useEffect(() => {
    if (nextReleaseTime === null || nowTime === null) return;
    const delay = Math.min(
      Math.max(nextReleaseTime - nowTime, 0) + RELEASE_GRACE_MS,
      MAX_TIMER_DELAY_MS,
    );
    const timeoutId = window.setTimeout(() => {
      handleDue();
    }, delay);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [nextReleaseTime, nowTime]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') handleDue();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
