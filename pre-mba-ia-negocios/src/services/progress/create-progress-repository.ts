import { InMemoryProgressRepository } from './InMemoryProgressRepository.ts';
import {
  type KeyValueStorage,
  LocalStorageProgressRepository,
} from './LocalStorageProgressRepository.ts';
import { PROGRESS_STORAGE_KEY } from './progress-storage-format.ts';
import type { ProgressRepository } from './ProgressRepository.ts';

function getBrowserStorage(): KeyValueStorage {
  return window.localStorage;
}

/** Even reading `window.localStorage` can throw (SecurityError) inside sandboxed iframes. */
function probeStorage(getStorage: () => KeyValueStorage): KeyValueStorage | null {
  try {
    const storage = getStorage();
    const probeKey = `${PROGRESS_STORAGE_KEY}:probe`;
    storage.setItem(probeKey, '1');
    storage.removeItem(probeKey);
    return storage;
  } catch {
    return null;
  }
}

/** Picks localStorage when usable, otherwise silently falls back to memory. */
export function createProgressRepository(
  getStorage: () => KeyValueStorage = getBrowserStorage,
): ProgressRepository {
  const storage = probeStorage(getStorage);
  return storage ? new LocalStorageProgressRepository(storage) : new InMemoryProgressRepository();
}
