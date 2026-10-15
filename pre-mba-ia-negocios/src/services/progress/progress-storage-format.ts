import { z } from 'zod';

/**
 * Persisted format of the learner progress. The key carries the major version; the payload
 * carries `version` so it can be migrated step by step (v0 → v1 → v2 ...).
 */
export const PROGRESS_STORAGE_KEY = 'xp-premba:v1:progress';
export const CURRENT_PROGRESS_VERSION = 2;

const lessonCompletionSchema = z.object({
  completedAt: z.string(),
  source: z.enum(['video', 'manual']),
});

const lessonProgressSchema = z.object({
  unlocked: z.boolean(),
  playStartedAt: z.number().nonnegative().nullable(),
  accumulatedMs: z.number().nonnegative(),
  completion: lessonCompletionSchema.nullable(),
});

const progressPayloadSchema = z.object({
  version: z.literal(CURRENT_PROGRESS_VERSION),
  journeys: z.record(z.string(), z.record(z.string(), lessonProgressSchema)),
  preferences: z.object({ soundEnabled: z.boolean().optional() }).default({}),
  /** `{ [journeyId]: { [lessonId]: { [materialId]: visitedAt } } }` — optional, no migration. */
  materialVisits: z
    .record(z.string(), z.record(z.string(), z.record(z.string(), z.string())))
    .default({}),
});

export type ProgressPayload = z.infer<typeof progressPayloadSchema>;

type UnknownPayload = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownPayload {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapRecord(value: unknown, transform: (entry: unknown) => unknown): unknown {
  return isRecord(value)
    ? Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, transform(entry)]))
    : value;
}

/** `MIGRATIONS[n]` upgrades a payload from version `n` to `n + 1`. */
const MIGRATIONS: Readonly<Record<number, (payload: UnknownPayload) => UnknownPayload>> = {
  // v0 → v1: payloads saved before versioning had the same shape but no `version` field.
  0: (payload) => ({ ...payload, version: 1 }),
  // v1 → v2: each entry was only a completion `{ completedAt, source }`. Those lessons were
  // already released (date-based), so they become unlocked and completed, with no open timer.
  1: (payload) => ({
    ...payload,
    version: 2,
    journeys: mapRecord(payload.journeys, (journey) =>
      mapRecord(journey, (completion) => ({
        unlocked: true,
        playStartedAt: null,
        accumulatedMs: 0,
        completion,
      })),
    ),
  }),
};

export type MigrationResult =
  | { readonly kind: 'ok'; readonly payload: ProgressPayload }
  | { readonly kind: 'newer-version' }
  | { readonly kind: 'invalid' };

export function migrateProgressPayload(raw: unknown): MigrationResult {
  if (!isRecord(raw)) return { kind: 'invalid' };

  let version = typeof raw.version === 'number' ? raw.version : 0;
  // Written by a newer release of the app: never downgrade (or overwrite) it.
  if (version > CURRENT_PROGRESS_VERSION) return { kind: 'newer-version' };

  let payload = raw;
  while (version < CURRENT_PROGRESS_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) return { kind: 'invalid' };
    payload = migrate(payload);
    version += 1;
  }

  const parsed = progressPayloadSchema.safeParse(payload);
  return parsed.success ? { kind: 'ok', payload: parsed.data } : { kind: 'invalid' };
}
