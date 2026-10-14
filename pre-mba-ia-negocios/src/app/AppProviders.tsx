import { type ReactNode, useState } from 'react';

import type { Journey } from '@/domain/types.ts';
import { AppServicesContext } from '@/hooks/useAppServices.ts';

import { readAppConfig } from './config.ts';
import { createAppServices } from './create-app-services.ts';

interface AppProvidersProps {
  readonly journey: Journey;
  readonly children: ReactNode;
}

/** Builds the services once and injects them into every hook below. */
export function AppProviders({ journey, children }: AppProvidersProps) {
  const [services] = useState(() =>
    createAppServices(readAppConfig(import.meta.env), journey, window.location.search),
  );
  return <AppServicesContext value={services}>{children}</AppServicesContext>;
}
