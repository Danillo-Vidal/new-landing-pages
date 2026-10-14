import { useCallback, useEffect, useEffectEvent, useMemo, useRef } from 'react';

import {
  checkpointPlayback,
  completeLesson,
  EMPTY_LESSON_PROGRESS,
  isCountingPlayback,
  pausePlayback,
  shouldCompleteByTime,
  startPlayback,
} from '@/domain/playback-tracker.ts';
import type {
  JourneyProgressRecord,
  Lesson,
  LessonId,
  LessonProgress,
  PlaybackMode,
} from '@/domain/types.ts';
import type { Clock } from '@/services/clock.ts';

const TICK_MS = 1000;

/** Players that do not report play/pause: their watched time is the elapsed time since play. */
export function reportsPlaybackEvents(lesson: Lesson): boolean {
  return lesson.video !== null && lesson.video.provider !== 'spalla';
}

export interface PlaybackControls {
  /** Facade clicked (or simulated play): starts counting for players without events. */
  readonly activate: (lessonId: LessonId) => void;
  readonly play: (lessonId: LessonId) => void;
  /** Pause, buffering, end of video or player unmounted. */
  readonly pause: (lessonId: LessonId) => void;
  /** The provider SDK failed: count the elapsed time from now on. */
  readonly trackingUnavailable: (lessonId: LessonId) => void;
}

interface UsePlaybackTrackerOptions {
  readonly lessons: readonly Lesson[];
  readonly threshold: number;
  readonly record: JourneyProgressRecord;
  readonly updateLesson: (
    lessonId: LessonId,
    update: (p: LessonProgress) => LessonProgress,
  ) => void;
  readonly clock: Clock;
  /** Writes a checkpointed copy of the record, so a reload keeps the time counted so far. */
  readonly persistSnapshot: (record: JourneyProgressRecord) => void;
  readonly onCompleted: (lessonId: LessonId) => void;
}

/**
 * Internal watched-time counter (nothing is rendered). Time always comes from Clock
 * timestamps; one 1 s interval runs only while some lesson is counting, and the state is
 * re-evaluated when the tab becomes visible again.
 */
export function usePlaybackTracker({
  lessons,
  threshold,
  record,
  updateLesson,
  clock,
  persistSnapshot,
  onCompleted,
}: UsePlaybackTrackerOptions): PlaybackControls {
  const modes = useRef(new Map<LessonId, PlaybackMode>());
  const lessonsById = useMemo(
    () => new Map(lessons.map((lesson) => [lesson.id, lesson])),
    [lessons],
  );

  const modeOf = useCallback(
    (lessonId: LessonId): PlaybackMode => {
      const lesson = lessonsById.get(lessonId);
      const fallback = lesson && reportsPlaybackEvents(lesson) ? 'playing-time' : 'wallclock';
      return modes.current.get(lessonId) ?? fallback;
    },
    [lessonsById],
  );

  const completeIfDue = useCallback(
    (lessonId: LessonId, progress: LessonProgress, nowMs: number): boolean => {
      const durationMs = lessonsById.get(lessonId)?.videoDurationMs ?? null;
      if (!shouldCompleteByTime(progress, nowMs, durationMs, threshold)) return false;
      const completion = { completedAt: clock.now().toISOString(), source: 'video' as const };
      updateLesson(lessonId, (current) => completeLesson(current, nowMs, completion));
      onCompleted(lessonId);
      return true;
    },
    [clock, lessonsById, onCompleted, threshold, updateLesson],
  );

  const start = useCallback(
    (lessonId: LessonId, mode: PlaybackMode) => {
      modes.current.set(lessonId, mode);
      const nowMs = clock.now().getTime();
      updateLesson(lessonId, (progress) => startPlayback(progress, nowMs));
    },
    [clock, updateLesson],
  );

  const pause = useCallback(
    (lessonId: LessonId) => {
      const nowMs = clock.now().getTime();
      if (completeIfDue(lessonId, record[lessonId] ?? EMPTY_LESSON_PROGRESS, nowMs)) return;
      const mode = modeOf(lessonId);
      updateLesson(lessonId, (progress) => pausePlayback(progress, nowMs, mode));
    },
    [clock, completeIfDue, modeOf, record, updateLesson],
  );

  const tick = useEffectEvent(() => {
    const nowMs = clock.now().getTime();
    let snapshot = record;
    for (const [lessonId, progress] of Object.entries(record)) {
      if (!isCountingPlayback(progress) || completeIfDue(lessonId, progress, nowMs)) continue;
      snapshot = { ...snapshot, [lessonId]: checkpointPlayback(progress, nowMs) };
    }
    if (snapshot !== record) persistSnapshot(snapshot);
  });

  const isAnyCounting = Object.values(record).some(isCountingPlayback);

  useEffect(() => {
    if (!isAnyCounting) return;
    const intervalId = window.setInterval(() => {
      tick();
    }, TICK_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAnyCounting]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') tick();
    };
    const handlePageHide = () => {
      tick();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return useMemo(
    () => ({
      activate: (lessonId: LessonId) => {
        const lesson = lessonsById.get(lessonId);
        if (lesson && !reportsPlaybackEvents(lesson)) start(lessonId, 'wallclock');
      },
      play: (lessonId: LessonId) => {
        start(lessonId, modeOf(lessonId));
      },
      pause,
      trackingUnavailable: (lessonId: LessonId) => {
        start(lessonId, 'wallclock');
      },
    }),
    [lessonsById, modeOf, pause, start],
  );
}
