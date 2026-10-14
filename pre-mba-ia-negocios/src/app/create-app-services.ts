import type { Journey } from '@/domain/types.ts';
import type { AppServices } from '@/hooks/useAppServices.ts';
import type { AccessProvider } from '@/services/access/AccessProvider.ts';
import { ApiAccessProvider } from '@/services/access/ApiAccessProvider.ts';
import { StaticAccessProvider } from '@/services/access/StaticAccessProvider.ts';
import { type Clock, resolveClock } from '@/services/clock.ts';
import { WebAudioUnlockSound } from '@/services/feedback/UnlockSound.ts';
import { createProgressRepository } from '@/services/progress/create-progress-repository.ts';

import type { AppConfig } from './config.ts';

function createAccessProvider(config: AppConfig, journey: Journey, clock: Clock): AccessProvider {
  switch (config.accessProvider) {
    case 'static':
      return new StaticAccessProvider(clock);
    case 'api':
      return new ApiAccessProvider({ baseUrl: config.accessApiBaseUrl, journeyId: journey.id });
  }
}

/** Composition root: the only place that decides which implementation of each port is used. */
export function createAppServices(
  config: AppConfig,
  journey: Journey,
  search: string,
): AppServices {
  const { clock, simulatedStart } = resolveClock({
    search,
    paramName: config.dateOverrideParam,
    speedParamName: config.clockSpeedParam,
    allowOverride: config.features.allowDateOverride,
    timeZone: journey.timezone,
  });

  return {
    clock,
    simulatedStart,
    accessProvider: createAccessProvider(config, journey, clock),
    progressRepository: createProgressRepository(),
    unlockSound: new WebAudioUnlockSound(),
    allowPlaybackSimulation: config.features.allowPlaybackSimulation,
  };
}
