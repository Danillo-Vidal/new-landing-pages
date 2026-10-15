import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';

import type { LessonId } from '@/domain/types.ts';
import type { UnlockSound } from '@/services/feedback/UnlockSound.ts';

/** Instant in the CSS timeline when the shackle opens (see `.unlock-*` in index.css). */
const SOUND_DELAY_MS = 800;
const REDUCED_MOTION_OVERLAY_MS = 1200;
/** Must match the `unlock-fade-out` duration in index.css. */
export const OVERLAY_FADE_MS = 180;
/** A double click on "Liberar aula" must not close the celebration right away. */
const CLOSE_GUARD_MS = 400;

export interface Celebration {
  readonly lessonId: LessonId;
  readonly order: number;
  readonly lessonTitle: string;
  readonly released: number;
  readonly total: number;
  /** Extra line when this unlock also reveals the reward card; `null` otherwise. */
  readonly note: string | null;
  readonly isReducedMotion: boolean;
}

interface UseUnlockCelebrationOptions {
  readonly durationMs: number;
  readonly sound: UnlockSound;
  readonly isSoundEnabled: boolean;
  readonly volume: number;
  /** Runs after the overlay is gone: commit the unlock, focus the card, scroll to the panel. */
  readonly onFinished: (lessonId: LessonId) => void;
}

/**
 * State and timing of the "Aula liberada!" sequence. Closes automatically, or immediately on
 * click, Enter or Esc. Focus is never trapped: it stays on the card that was clicked.
 */
export function useUnlockCelebration({
  durationMs,
  sound,
  isSoundEnabled,
  volume,
  onFinished,
}: UseUnlockCelebrationOptions) {
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const isClosable = useRef(false);
  const finish = useEffectEvent(onFinished);

  const start = useCallback(
    (data: Omit<Celebration, 'isReducedMotion'>) => {
      if (celebration !== null) return; // ignore clicks while the animation runs
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // Inside the click handler: browsers only allow starting audio during a user gesture.
      if (isSoundEnabled) sound.play({ volume, delayMs: isReducedMotion ? 0 : SOUND_DELAY_MS });
      isClosable.current = false;
      setIsClosing(false);
      setCelebration({ ...data, isReducedMotion });
    },
    [celebration, isSoundEnabled, sound, volume],
  );

  const close = useCallback((force = false) => {
    if (!force && !isClosable.current) return;
    isClosable.current = false;
    setIsClosing(true);
  }, []);

  // Timeline: guard → auto close → fade out → finished.
  useEffect(() => {
    if (celebration === null || isClosing) return;
    const total = celebration.isReducedMotion ? REDUCED_MOTION_OVERLAY_MS : durationMs;
    const guardId = window.setTimeout(() => {
      isClosable.current = true;
    }, CLOSE_GUARD_MS);
    const autoCloseId = window.setTimeout(() => {
      close(true);
    }, total - OVERLAY_FADE_MS);
    return () => {
      window.clearTimeout(guardId);
      window.clearTimeout(autoCloseId);
    };
  }, [celebration, close, durationMs, isClosing]);

  useEffect(() => {
    if (celebration === null || !isClosing) return;
    const timeoutId = window.setTimeout(() => {
      setCelebration(null);
      setIsClosing(false);
      finish(celebration.lessonId);
    }, OVERLAY_FADE_MS);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [celebration, isClosing]);

  // Enter / Esc close it. `preventDefault` stops Enter from "clicking" the focused card again.
  useEffect(() => {
    if (celebration === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close(event.key === 'Escape');
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [celebration, close]);

  const closeOnClick = useCallback(() => {
    close();
  }, [close]);

  return { celebration, isClosing, start, close: closeOnClick };
}
