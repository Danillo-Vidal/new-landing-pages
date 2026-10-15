import { useCallback, useRef, useState } from 'react';

import { isRewardUnlocked } from '@/domain/reward.ts';
import type { Course, LessonId } from '@/domain/types.ts';
import { ANCHORS } from '@/lib/anchors.ts';

import { useAppServices } from './useAppServices.ts';
import type { JourneyViewModel } from './useJourney.ts';
import { OVERLAY_FADE_MS, useUnlockCelebration } from './useUnlockCelebration.ts';

function focusLessonCard(lessonId: LessonId) {
  document
    .querySelector<HTMLElement>(`[data-lesson-id="${CSS.escape(lessonId)}"]`)
    ?.focus({ preventScroll: true });
}

/**
 * The unlock that reveals the reward card does NOT scroll to the lesson panel (the learner
 * would miss the reveal): the page only scrolls, instantly and if needed, to show the cards.
 * Instant on purpose: two smooth scrolls at once (page + card strip) cancel each other in Chrome.
 */
function bringLessonListIntoView() {
  const list = document.getElementById(ANCHORS.lessonList);
  if (!list) return;
  const { top, bottom } = list.getBoundingClientRect();
  if (top < 0 || bottom > window.innerHeight) list.scrollIntoView({ block: 'nearest' });
}

/** After the celebration: focus the unlocked card and bring the lesson panel into view. */
function revealUnlockedLesson(lessonId: LessonId) {
  requestAnimationFrame(() => {
    focusLessonCard(lessonId);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById(ANCHORS.lessonPanel)
      ?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
}

/** "Liberar aula" sequence, sound preference and the one-off card highlight. */
export function useJourneyInteractions(course: Course, viewModel: JourneyViewModel) {
  const { unlockSound } = useAppServices();
  const [highlightedId, setHighlightedId] = useState<LessonId | null>(null);
  // The reward card is mounted (invisible) while the overlay covers the page.
  const [isPreparingReveal, setIsPreparingReveal] = useState(false);
  const revealsReward = useRef(false);
  const prepareTimer = useRef<number | undefined>(undefined);

  const unlockLesson = viewModel.status === 'ready' ? viewModel.unlockLesson : null;
  const celebration = useUnlockCelebration({
    durationMs: course.animation.unlockOverlayMs,
    sound: unlockSound,
    isSoundEnabled: true,
    volume: course.sound.volume,
    onFinished: (lessonId) => {
      const isRewardReveal = revealsReward.current;
      revealsReward.current = false;
      window.clearTimeout(prepareTimer.current);
      if (isRewardReveal) bringLessonListIntoView();
      unlockLesson?.(lessonId);
      setIsPreparingReveal(false);
      setHighlightedId(lessonId);
      if (isRewardReveal) requestAnimationFrame(() => focusLessonCard(lessonId));
      else revealUnlockedLesson(lessonId);
    },
  });

  const startUnlock = (lessonId: LessonId) => {
    if (viewModel.status !== 'ready' || celebration.celebration) return;
    const state = viewModel.lessonStates.find((item) => item.lesson.id === lessonId);
    if (state?.status !== 'ready') return;

    // Does THIS unlock make the reward condition true?
    const { unlockWhen, enabled, overlayNote } = course.reward;
    const statuses = viewModel.lessonStates.map((item) => item.status);
    const projected = viewModel.lessonStates.map((item) =>
      item.lesson.id === lessonId ? 'available' : item.status,
    );
    revealsReward.current =
      !isRewardUnlocked(statuses, unlockWhen, enabled) &&
      isRewardUnlocked(projected, unlockWhen, enabled);

    viewModel.announce('unlocked', lessonId);
    celebration.start({
      lessonId,
      order: state.lesson.order,
      lessonTitle: state.lesson.title,
      released: viewModel.progress.released + 1,
      total: viewModel.progress.total,
      note: revealsReward.current ? overlayNote : null,
    });
    // Layout switch (grid → carousel) only once the overlay fully covers the page.
    if (revealsReward.current) {
      prepareTimer.current = window.setTimeout(() => {
        setIsPreparingReveal(true);
      }, OVERLAY_FADE_MS);
    }
  };

  const clearHighlight = useCallback(() => {
    setHighlightedId(null);
  }, []);

  return { celebration, highlightedId, isPreparingReveal, startUnlock, clearHighlight };
}
