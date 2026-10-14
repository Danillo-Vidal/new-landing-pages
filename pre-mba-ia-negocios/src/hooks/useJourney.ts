import { useCallback, useMemo, useRef, useState } from 'react';

import { computeJourneyProgress } from '@/domain/journey-progress.ts';
import { getNextReleaseAt, resolveLessonStates } from '@/domain/lesson-status.ts';
import {
  completeLesson,
  interruptPlayback,
  uncompleteLesson,
  unlockLessonProgress,
} from '@/domain/playback-tracker.ts';
import type {
  Course,
  JourneyProgress,
  JourneyProgressRecord,
  LessonId,
  LessonState,
} from '@/domain/types.ts';
import { hasReachedCompletion } from '@/domain/video-completion.ts';

import { useAccessContext } from './useAccessContext.ts';
import { useAppServices } from './useAppServices.ts';
import { useLessonProgress } from './useLessonProgress.ts';
import { useLessonSelection } from './useLessonSelection.ts';
import {
  type PlaybackControls,
  reportsPlaybackEvents,
  usePlaybackTracker,
} from './usePlaybackTracker.ts';
import { useReleaseRefresh } from './useReleaseRefresh.ts';

export type JourneyViewModel =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly retry: () => void }
  | {
      readonly status: 'ready';
      readonly lessonStates: readonly LessonState[];
      readonly progress: JourneyProgress;
      readonly selectedState: LessonState | null;
      readonly nextReleaseAt: Date | null;
      readonly announcement: LessonAnnouncement | null;
      readonly announce: (kind: LessonAnnouncement['kind'], lessonId: LessonId) => void;
      readonly selectLesson: (lessonId: LessonId) => void;
      /** Commits "Liberar aula" (only for `ready` lessons) and opens the lesson. */
      readonly unlockLesson: (lessonId: LessonId) => void;
      readonly setLessonCompleted: (lessonId: LessonId, completed: boolean) => void;
      readonly reportVideoProgress: (lessonId: LessonId, ratio: number) => void;
      readonly playback: PlaybackControls;
    };

/** Screen-reader event; `id` changes on every event so repeated texts are announced again. */
export interface LessonAnnouncement {
  readonly kind: 'unlocked' | 'completed';
  readonly order: number;
  readonly id: number;
}

const NO_STATES: readonly LessonState[] = [];

/** Orchestrates access, progress and selection. All business rules come from `domain/`. */
export function useJourney(course: Course): JourneyViewModel {
  const { accessProvider, progressRepository, clock } = useAppServices();
  const { state: access, refresh, retry } = useAccessContext(accessProvider);
  const journeyId = course.journey.id;

  // Players with events always reload paused: an open segment saved for them is dropped.
  const prepareRecord = (record: JourneyProgressRecord): JourneyProgressRecord =>
    Object.fromEntries(
      Object.entries(record).map(([lessonId, progress]) => {
        const lesson = course.lessons.find((item) => item.id === lessonId);
        return [
          lessonId,
          lesson && reportsPlaybackEvents(lesson) ? interruptPlayback(progress) : progress,
        ];
      }),
    );
  const { record, updateLesson } = useLessonProgress(progressRepository, journeyId, prepareRecord);

  const context = access.status === 'ready' ? access.context : null;
  const lessonStates = useMemo(
    () => (context ? resolveLessonStates(course, context, record) : NO_STATES),
    [course, context, record],
  );
  const progress = useMemo(() => computeJourneyProgress(lessonStates), [lessonStates]);
  const nextReleaseAt = useMemo(
    () => (context ? getNextReleaseAt(lessonStates, context.now) : null),
    [lessonStates, context],
  );

  useReleaseRefresh(nextReleaseAt, context?.now ?? null, refresh);
  const { selectedState, selectLesson, revealLesson } = useLessonSelection(lessonStates);

  const [announcement, setAnnouncement] = useState<LessonAnnouncement | null>(null);
  const announce = useCallback(
    (kind: LessonAnnouncement['kind'], lessonId: LessonId) => {
      const order = course.lessons.find((lesson) => lesson.id === lessonId)?.order ?? 0;
      setAnnouncement((previous) => ({ kind, order, id: (previous?.id ?? 0) + 1 }));
    },
    [course.lessons],
  );

  const playback = usePlaybackTracker({
    lessons: course.lessons,
    threshold: course.journey.completionThreshold,
    record,
    updateLesson,
    clock,
    persistSnapshot: (snapshot) => {
      progressRepository.save(journeyId, snapshot);
    },
    onCompleted: (lessonId) => {
      announce('completed', lessonId);
    },
  });

  const markCompleted = useCallback(
    (lessonId: LessonId, source: 'video' | 'manual') => {
      const now = clock.now();
      const completion = { completedAt: now.toISOString(), source };
      updateLesson(lessonId, (current) => completeLesson(current, now.getTime(), completion));
    },
    [clock, updateLesson],
  );

  // Fallback for videos without `duration`: the player-reported position completes the lesson,
  // at most once per visit, so "Desmarcar" sticks.
  const autoCompletedIds = useRef(new Set<LessonId>());
  const { completionThreshold } = course.journey;

  const reportVideoProgress = useCallback(
    (lessonId: LessonId, ratio: number) => {
      const lesson = course.lessons.find((item) => item.id === lessonId);
      if (!lesson || lesson.videoDurationMs !== null) return;
      if (autoCompletedIds.current.has(lessonId)) return;
      if (!hasReachedCompletion(ratio, completionThreshold)) return;
      autoCompletedIds.current.add(lessonId);
      markCompleted(lessonId, 'video');
    },
    [completionThreshold, course.lessons, markCompleted],
  );

  const setLessonCompleted = useCallback(
    (lessonId: LessonId, completed: boolean) => {
      if (completed) markCompleted(lessonId, 'manual');
      else updateLesson(lessonId, uncompleteLesson);
    },
    [markCompleted, updateLesson],
  );

  const unlockLesson = useCallback(
    (lessonId: LessonId) => {
      const target = lessonStates.find((state) => state.lesson.id === lessonId);
      if (target?.status !== 'ready') return; // never out of order
      updateLesson(lessonId, unlockLessonProgress);
      revealLesson(lessonId);
    },
    [lessonStates, revealLesson, updateLesson],
  );

  if (access.status === 'loading') return { status: 'loading' };
  if (access.status === 'error') return { status: 'error', retry };

  return {
    status: 'ready',
    lessonStates,
    progress,
    selectedState,
    nextReleaseAt,
    announcement,
    announce,
    selectLesson,
    unlockLesson,
    setLessonCompleted,
    reportVideoProgress,
    playback,
  };
}
