import { useCallback, useState } from 'react';

import { pickInitialLessonId } from '@/domain/lesson-selection.ts';
import { isLessonSelectable } from '@/domain/lesson-status.ts';
import type { LessonId, LessonState } from '@/domain/types.ts';

interface UseLessonSelectionResult {
  readonly selectedState: LessonState | null;
  readonly selectLesson: (lessonId: LessonId) => void;
  /** Selects a lesson that becomes selectable in the same update (e.g. right after unlocking). */
  readonly revealLesson: (lessonId: LessonId) => void;
}

export function useLessonSelection(states: readonly LessonState[]): UseLessonSelectionResult {
  const [selectedId, setSelectedId] = useState<LessonId | null>(null);

  // Auto-select once (on load, or when the first lesson unlocks while the page is open).
  // Done during render — React's recommended pattern for state derived from new data.
  if (selectedId === null) {
    const initialId = pickInitialLessonId(states);
    if (initialId !== null) setSelectedId(initialId);
  }

  const selectedState =
    states.find((state) => state.lesson.id === selectedId && isLessonSelectable(state)) ?? null;

  const selectLesson = useCallback(
    (lessonId: LessonId) => {
      const target = states.find((state) => state.lesson.id === lessonId);
      if (target && isLessonSelectable(target)) setSelectedId(lessonId);
    },
    [states],
  );

  const revealLesson = useCallback((lessonId: LessonId) => {
    setSelectedId(lessonId);
  }, []);

  return { selectedState, selectLesson, revealLesson };
}
