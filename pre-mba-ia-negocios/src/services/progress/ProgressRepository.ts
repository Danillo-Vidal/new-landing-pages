import type {
  CompletionSource,
  JourneyProgressRecord,
  LessonCompletion,
  LessonId,
  LessonProgress,
} from '@/domain/types.ts';

export type { CompletionSource, JourneyProgressRecord, LessonCompletion, LessonProgress };

/**
 * Support materials the learner opened ("presencialidade"), per lesson:
 * `{ [lessonId]: { [materialId]: visitedAt (ISO-8601) } }`.
 */
export type MaterialVisitsRecord = Readonly<Record<LessonId, Readonly<Record<string, string>>>>;

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
  loadMaterialVisits(journeyId: string): MaterialVisitsRecord;
  saveMaterialVisits(journeyId: string, record: MaterialVisitsRecord): void;
}
