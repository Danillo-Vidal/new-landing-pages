import {
  CURRENT_PROGRESS_VERSION,
  migrateProgressPayload,
  PROGRESS_STORAGE_KEY,
  type ProgressPayload,
} from './progress-storage-format.ts';
import type {
  JourneyProgressRecord,
  LearnerPreferences,
  MaterialVisitsRecord,
  ProgressRepository,
} from './ProgressRepository.ts';

/** Minimal Storage surface, so tests can inject a fake. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type ReadResult = ReturnType<typeof migrateProgressPayload> | { readonly kind: 'empty' };

export class LocalStorageProgressRepository implements ProgressRepository {
  private readonly storage: KeyValueStorage;
  private readonly key: string;

  constructor(storage: KeyValueStorage, key: string = PROGRESS_STORAGE_KEY) {
    this.storage = storage;
    this.key = key;
  }

  load(journeyId: string): JourneyProgressRecord {
    const result = this.read();
    return result.kind === 'ok' ? (result.payload.journeys[journeyId] ?? {}) : {};
  }

  save(journeyId: string, record: JourneyProgressRecord): void {
    this.update((payload) => ({
      ...payload,
      journeys: { ...payload.journeys, [journeyId]: record },
    }));
  }

  loadPreferences(): LearnerPreferences {
    const result = this.read();
    return result.kind === 'ok' ? result.payload.preferences : {};
  }

  savePreferences(preferences: LearnerPreferences): void {
    this.update((payload) => ({ ...payload, preferences }));
  }

  loadMaterialVisits(journeyId: string): MaterialVisitsRecord {
    const result = this.read();
    return result.kind === 'ok' ? (result.payload.materialVisits[journeyId] ?? {}) : {};
  }

  saveMaterialVisits(journeyId: string, record: MaterialVisitsRecord): void {
    this.update((payload) => ({
      ...payload,
      materialVisits: { ...payload.materialVisits, [journeyId]: record },
    }));
  }

  private update(change: (payload: ProgressPayload) => ProgressPayload): void {
    const result = this.read();
    if (result.kind === 'newer-version') return;

    const current: ProgressPayload =
      result.kind === 'ok'
        ? result.payload
        : {
            version: CURRENT_PROGRESS_VERSION,
            journeys: {},
            preferences: {},
            materialVisits: {},
          };
    try {
      this.storage.setItem(this.key, JSON.stringify(change(current)));
    } catch {
      // Quota exceeded or storage revoked mid-session: progress stays in memory for this visit.
    }
  }

  private read(): ReadResult {
    try {
      const serialized = this.storage.getItem(this.key);
      if (serialized === null) return { kind: 'empty' };
      return migrateProgressPayload(JSON.parse(serialized));
    } catch {
      return { kind: 'invalid' };
    }
  }
}
