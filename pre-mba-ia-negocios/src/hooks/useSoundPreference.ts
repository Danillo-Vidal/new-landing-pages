import { useCallback, useState } from 'react';

import type { ProgressRepository } from '@/services/progress/ProgressRepository.ts';

/** "Som das conquistas" on/off, persisted through the progress repository. */
export function useSoundPreference(repository: ProgressRepository, enabledByDefault: boolean) {
  const [isEnabled, setIsEnabled] = useState(
    () => repository.loadPreferences().soundEnabled ?? enabledByDefault,
  );

  const toggle = useCallback(() => {
    const next = !isEnabled;
    setIsEnabled(next);
    repository.savePreferences({ ...repository.loadPreferences(), soundEnabled: next });
  }, [isEnabled, repository]);

  return { isEnabled, toggle };
}
