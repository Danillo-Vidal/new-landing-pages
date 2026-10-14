import type {
  CompletionSource,
  JourneyProgressRecord,
  LessonCompletion,
  LessonProgress,
} from '@/domain/types.ts';

export type { CompletionSource, JourneyProgressRecord, LessonCompletion, LessonProgress };

/** Learner choices that are not tied to a journey. `undefined` = never chosen. */
export interface LearnerPreferences {
  readonly soundEnabled?: boolean;
}

/**
 * Port for persisting learner progress. Components and hooks never touch browser storage
 * directly — only implementations of this interface do. In phase 2 an API-backed
 * implementation can replace it without touching the UI.
 */
export interface ProgressRepository {
  load(journeyId: string): JourneyProgressRecord;
  save(journeyId: string, record: JourneyProgressRecord): void;
  loadPreferences(): LearnerPreferences;
  savePreferences(preferences: LearnerPreferences): void;
}
