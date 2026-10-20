import { createContext, useContext } from 'react';

import type { AccessProvider } from '@/services/access/AccessProvider.ts';
import type { Clock } from '@/services/clock.ts';
import type { UnlockSound } from '@/services/feedback/UnlockSound.ts';
import type { ProgressRepository } from '@/services/progress/ProgressRepository.ts';

/** Dependencies injected into hooks (built once in `app/create-app-services.ts`). */
export interface AppServices {
  readonly clock: Clock;
  /** Set when `?today=` is simulating a date. */
  readonly simulatedStart: Date | null;
  readonly accessProvider: AccessProvider;
  readonly progressRepository: ProgressRepository;
  readonly unlockSound: UnlockSound;
}

export const AppServicesContext = createContext<AppServices | null>(null);

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext);
  if (!services) throw new Error('useAppServices must be used inside <AppServicesContext>.');
  return services;
}
