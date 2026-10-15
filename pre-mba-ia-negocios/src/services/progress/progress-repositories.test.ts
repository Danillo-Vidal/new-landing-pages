import { describe, expect, it } from 'vitest';

import { createProgressRepository } from './create-progress-repository.ts';
import { InMemoryProgressRepository } from './InMemoryProgressRepository.ts';
import {
  type KeyValueStorage,
  LocalStorageProgressRepository,
} from './LocalStorageProgressRepository.ts';
import { migrateProgressPayload, PROGRESS_STORAGE_KEY } from './progress-storage-format.ts';

class FakeStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

const JOURNEY = 'pre-mba-ia-negocios';
const completion = { completedAt: '2026-10-14T12:00:00.000Z', source: 'manual' as const };
const lesson = { unlocked: true, playStartedAt: null, accumulatedMs: 0, completion };

describe('LocalStorageProgressRepository', () => {
  it('persists and reloads progress under the versioned key', () => {
    const storage = new FakeStorage();
    new LocalStorageProgressRepository(storage).save(JOURNEY, { 'aula-1': lesson });

    expect(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY) ?? '')).toEqual({
      version: 2,
      journeys: { [JOURNEY]: { 'aula-1': lesson } },
      preferences: {},
      materialVisits: {},
    });
    expect(new LocalStorageProgressRepository(storage).load(JOURNEY)).toEqual({
      'aula-1': lesson,
    });
  });

  it('keeps the watched-time counters (internal, never shown)', () => {
    const storage = new FakeStorage();
    const counting = {
      unlocked: true,
      playStartedAt: 1_000,
      accumulatedMs: 42_000,
      completion: null,
    };
    new LocalStorageProgressRepository(storage).save(JOURNEY, { 'aula-2': counting });
    expect(new LocalStorageProgressRepository(storage).load(JOURNEY)).toEqual({
      'aula-2': counting,
    });
  });

  it('keeps other journeys untouched (GitHub Pages shares one origin per account)', () => {
    const storage = new FakeStorage();
    const repository = new LocalStorageProgressRepository(storage);
    repository.save('outra-jornada', { 'aula-9': lesson });
    repository.save(JOURNEY, { 'aula-1': lesson });
    expect(repository.load('outra-jornada')).toEqual({ 'aula-9': lesson });
  });

  it('persists the sound preference next to the progress', () => {
    const storage = new FakeStorage();
    const repository = new LocalStorageProgressRepository(storage);
    expect(repository.loadPreferences()).toEqual({});
    repository.save(JOURNEY, { 'aula-1': lesson });
    repository.savePreferences({ soundEnabled: false });
    const reloaded = new LocalStorageProgressRepository(storage);
    expect(reloaded.loadPreferences()).toEqual({ soundEnabled: false });
    expect(reloaded.load(JOURNEY)).toEqual({ 'aula-1': lesson });
  });

  it('remembers the support materials the learner opened, next to the progress', () => {
    const storage = new FakeStorage();
    const repository = new LocalStorageProgressRepository(storage);
    expect(repository.loadMaterialVisits(JOURNEY)).toEqual({});
    repository.save(JOURNEY, { 'aula-1': lesson });
    repository.saveMaterialVisits(JOURNEY, { 'aula-1': { guia: '2026-10-15T12:00:00.000Z' } });

    const reloaded = new LocalStorageProgressRepository(storage);
    expect(reloaded.loadMaterialVisits(JOURNEY)).toEqual({
      'aula-1': { guia: '2026-10-15T12:00:00.000Z' },
    });
    expect(reloaded.load(JOURNEY)).toEqual({ 'aula-1': lesson });
    expect(reloaded.loadMaterialVisits('outra-jornada')).toEqual({});
  });

  it('reads payloads saved before material visits existed (no migration needed)', () => {
    const storage = new FakeStorage();
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        journeys: { [JOURNEY]: { 'aula-1': lesson } },
        preferences: {},
      }),
    );
    const repository = new LocalStorageProgressRepository(storage);
    expect(repository.load(JOURNEY)).toEqual({ 'aula-1': lesson });
    expect(repository.loadMaterialVisits(JOURNEY)).toEqual({});
  });

  it('returns empty progress for corrupted data instead of crashing', () => {
    const storage = new FakeStorage();
    storage.setItem(PROGRESS_STORAGE_KEY, '{not json');
    expect(new LocalStorageProgressRepository(storage).load(JOURNEY)).toEqual({});
  });

  it('does not overwrite data written by a newer app version', () => {
    const storage = new FakeStorage();
    const newer = JSON.stringify({ version: 99, anything: true });
    storage.setItem(PROGRESS_STORAGE_KEY, newer);
    const repository = new LocalStorageProgressRepository(storage);
    repository.save(JOURNEY, { 'aula-1': lesson });
    expect(repository.load(JOURNEY)).toEqual({});
    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBe(newer);
  });

  it('survives a storage that throws on write (quota / revoked)', () => {
    const storage = new FakeStorage();
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    expect(() =>
      new LocalStorageProgressRepository(storage).save(JOURNEY, { 'aula-1': lesson }),
    ).not.toThrow();
  });
});

describe('migrateProgressPayload', () => {
  const v2 = {
    version: 2,
    journeys: { [JOURNEY]: { 'aula-1': lesson } },
    preferences: {},
    materialVisits: {},
  };

  it('upgrades v1 (completions only) to v2: completed lessons stay unlocked and completed', () => {
    expect(
      migrateProgressPayload({ version: 1, journeys: { [JOURNEY]: { 'aula-1': completion } } }),
    ).toEqual({ kind: 'ok', payload: v2 });
  });

  it('upgrades an unversioned (v0) payload all the way to v2', () => {
    expect(migrateProgressPayload({ journeys: { [JOURNEY]: { 'aula-1': completion } } })).toEqual({
      kind: 'ok',
      payload: v2,
    });
  });

  it('rejects payloads with an invalid shape', () => {
    expect(migrateProgressPayload({ version: 2, journeys: 'oops' })).toEqual({ kind: 'invalid' });
    expect(
      migrateProgressPayload({
        version: 2,
        journeys: { [JOURNEY]: { 'aula-1': { ...lesson, accumulatedMs: -5 } } },
      }),
    ).toEqual({ kind: 'invalid' });
    expect(migrateProgressPayload(['aula-1'])).toEqual({ kind: 'invalid' });
  });
});

describe('createProgressRepository', () => {
  it('uses the storage when it is available', () => {
    expect(createProgressRepository(() => new FakeStorage())).toBeInstanceOf(
      LocalStorageProgressRepository,
    );
  });

  it('falls back to memory when the storage is blocked (iframe in an LMS)', () => {
    const repository = createProgressRepository(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    expect(repository).toBeInstanceOf(InMemoryProgressRepository);
    repository.save(JOURNEY, { 'aula-1': lesson });
    repository.savePreferences({ soundEnabled: false });
    expect(repository.load(JOURNEY)).toEqual({ 'aula-1': lesson });
    expect(repository.loadPreferences()).toEqual({ soundEnabled: false });
  });
});
