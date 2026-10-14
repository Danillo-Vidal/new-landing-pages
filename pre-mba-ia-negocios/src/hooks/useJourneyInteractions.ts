import { useCallback, useState } from 'react';

import type { Course, LessonId } from '@/domain/types.ts';
import { ANCHORS } from '@/lib/anchors.ts';

import { useAppServices } from './useAppServices.ts';
import type { JourneyViewModel } from './useJourney.ts';
import { useSoundPreference } from './useSoundPreference.ts';
import { useUnlockCelebration } from './useUnlockCelebration.ts';

/** After the celebration: focus the unlocked card and bring the lesson panel into view. */
function revealUnlockedLesson(lessonId: LessonId) {
  requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>(`[data-lesson-id="${CSS.escape(lessonId)}"]`)
      ?.focus({ preventScroll: true });
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById(ANCHORS.lessonPanel)
      ?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
}

/** "Liberar aula" sequence, sound preference and the one-off card highlight. */
export function useJourneyInteractions(course: Course, viewModel: JourneyViewModel) {
  const { progressRepository, unlockSound } = useAppServices();
  const sound = useSoundPreference(progressRepository, course.sound.enabledByDefault);
  const [highlightedId, setHighlightedId] = useState<LessonId | null>(null);

  const unlockLesson = viewModel.status === 'ready' ? viewModel.unlockLesson : null;
  const celebration = useUnlockCelebration({
    durationMs: course.animation.unlockOverlayMs,
    sound: unlockSound,
    isSoundEnabled: sound.isEnabled,
    volume: course.sound.volume,
    onFinished: (lessonId) => {
      unlockLesson?.(lessonId);
      setHighlightedId(lessonId);
      revealUnlockedLesson(lessonId);
    },
  });

  const startUnlock = (lessonId: LessonId) => {
    if (viewModel.status !== 'ready') return;
    const state = viewModel.lessonStates.find((item) => item.lesson.id === lessonId);
    if (state?.status !== 'ready') return;
    viewModel.announce('unlocked', lessonId);
    celebration.start({
      lessonId,
      order: state.lesson.order,
      lessonTitle: state.lesson.title,
      released: viewModel.progress.released + 1,
      total: viewModel.progress.total,
    });
  };

  const clearHighlight = useCallback(() => {
    setHighlightedId(null);
  }, []);

  return { celebration, sound, highlightedId, startUnlock, clearHighlight };
}
