import type {
  JourneyProgressRecord,
  LearnerPreferences,
  MaterialVisitsRecord,
  ProgressRepository,
} from './ProgressRepository.ts';

/**
 * Fallback when browser storage is blocked (common for third-party iframes inside an LMS).
 * Progress works normally during the visit and is lost on reload.
 */
export class InMemoryProgressRepository implements ProgressRepository {
  private readonly records = new Map<string, JourneyProgressRecord>();
  private preferences: LearnerPreferences = {};
  private readonly materialVisits = new Map<string, MaterialVisitsRecord>();

  load(journeyId: string): JourneyProgressRecord {
    return this.records.get(journeyId) ?? {};
  }

  save(journeyId: string, record: JourneyProgressRecord): void {
    this.records.set(journeyId, record);
  }

  loadPreferences(): LearnerPreferences {
    return this.preferences;
  }

  savePreferences(preferences: LearnerPreferences): void {
    this.preferences = preferences;
  }

  loadMaterialVisits(journeyId: string): MaterialVisitsRecord {
    return this.materialVisits.get(journeyId) ?? {};
  }

  saveMaterialVisits(journeyId: string, record: MaterialVisitsRecord): void {
    this.materialVisits.set(journeyId, record);
  }
}
