import type { Journey } from '@/domain/types.ts';
import type { AppServices } from '@/hooks/useAppServices.ts';
import type { AccessProvider } from '@/services/access/AccessProvider.ts';
import { ApiAccessProvider } from '@/services/access/ApiAccessProvider.ts';
import {
  D2LWidgetAccessProvider,
  isD2LWidgetLaunch,
} from '@/services/access/D2LWidgetAccessProvider.ts';
import { StaticAccessProvider } from '@/services/access/StaticAccessProvider.ts';
import { type Clock, resolveClock } from '@/services/clock.ts';
import { WebAudioUnlockSound } from '@/services/feedback/UnlockSound.ts';
import { createProgressRepository } from '@/services/progress/create-progress-repository.ts';

import type { AppConfig } from './config.ts';

interface AccessProviderOptions {
  readonly config: AppConfig;
  readonly journey: Journey;
  readonly clock: Clock;
  readonly search: string;
  readonly isDateSimulated: boolean;
}

function createAccessProvider({
  config,
  journey,
  clock,
  search,
  isDateSimulated,
}: AccessProviderOptions): AccessProvider {
  switch (config.accessProvider) {
    case 'api':
      return new ApiAccessProvider({ baseUrl: config.accessApiBaseUrl, journeyId: journey.id });
    case 'static':
      // Opened by the D2L widget (?d2l=1): the widget sends the learner's enrollment date.
      return isD2LWidgetLaunch(search, config.d2lBridgeParam)
        ? new D2LWidgetAccessProvider({
            parentOrigin: config.d2lOrigin,
            clock,
            useServerTime: !isDateSimulated,
          })
        : new StaticAccessProvider(clock);
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
    accessProvider: createAccessProvider({
      config,
      journey,
      clock,
      search,
      isDateSimulated: simulatedStart !== null,
    }),
    progressRepository: createProgressRepository(),
    unlockSound: new WebAudioUnlockSound(),
  };
}
