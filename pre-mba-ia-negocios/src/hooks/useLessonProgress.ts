import { useCallback, useEffect, useRef, useState } from 'react';

import { EMPTY_LESSON_PROGRESS } from '@/domain/playback-tracker.ts';
import type { JourneyProgressRecord, LessonId, LessonProgress } from '@/domain/types.ts';
import type { ProgressRepository } from '@/services/progress/ProgressRepository.ts';

type LessonProgressUpdate = (progress: LessonProgress) => LessonProgress;

interface UseLessonProgressResult {
  readonly record: JourneyProgressRecord;
  /** Applies a pure transition (see domain/playback-tracker.ts) to one lesson. */
  readonly updateLesson: (lessonId: LessonId, update: LessonProgressUpdate) => void;
}

/**
 * Learner progress (unlocks, internal watched time, completions): in-memory state for instant
 * UI updates, persisted through the repository. `prepare` normalizes the loaded record once.
 */
export function useLessonProgress(
  repository: ProgressRepository,
  journeyId: string,
  prepare: (record: JourneyProgressRecord) => JourneyProgressRecord = (record) => record,
): UseLessonProgressResult {
  const [record, setRecord] = useState<JourneyProgressRecord>(() =>
    prepare(repository.load(journeyId)),
  );
  const loadedRecord = useRef(record);

  useEffect(() => {
    // Skip the initial load so we never rewrite storage just by opening the page.
    if (record !== loadedRecord.current) repository.save(journeyId, record);
  }, [record, repository, journeyId]);

  const updateLesson = useCallback((lessonId: LessonId, update: LessonProgressUpdate) => {
    setRecord((previous) => {
      const current = previous[lessonId] ?? EMPTY_LESSON_PROGRESS;
      const next = update(current);
      return next === current ? previous : { ...previous, [lessonId]: next };
    });
  }, []);

  return { record, updateLesson };
}
