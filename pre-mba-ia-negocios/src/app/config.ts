import { z } from 'zod';

import type { AccessProviderKind } from '@/services/access/AccessProvider.ts';

/** Runtime configuration, read ONLY from build-time environment variables (see .env.example). */
export interface AppConfig {
  readonly accessProvider: AccessProviderKind;
  readonly accessApiBaseUrl: string;
  readonly dateOverrideParam: string;
  /** `?speed=60` makes the clock 60× faster (same flag as `?today=`). */
  readonly clockSpeedParam: string;
  readonly features: {
    /** Enables `?today=AAAA-MM-DD` and `?speed=N`. Default: on in development, off in production. */
    readonly allowDateOverride: boolean;
    /** "Simular reprodução" on lessons without video. Default: on in development only. */
    readonly allowPlaybackSimulation: boolean;
  };
}

const booleanFlag = z.enum(['true', 'false']).transform((value) => value === 'true');

const envSchema = z.object({
  VITE_ACCESS_PROVIDER: z.enum(['static', 'api']).default('static'),
  VITE_ACCESS_API_BASE_URL: z.string().trim().default(''),
  VITE_ALLOW_DATE_OVERRIDE: z
    .union([z.literal('').transform(() => undefined), booleanFlag])
    .optional(),
  VITE_ALLOW_PLAYBACK_SIMULATION: z
    .union([z.literal('').transform(() => undefined), booleanFlag])
    .optional(),
});

export function readAppConfig(env: ImportMetaEnv & { readonly DEV: boolean }): AppConfig {
  const parsed = envSchema.parse(env);
  return {
    accessProvider: parsed.VITE_ACCESS_PROVIDER,
    accessApiBaseUrl: parsed.VITE_ACCESS_API_BASE_URL,
    dateOverrideParam: 'today',
    clockSpeedParam: 'speed',
    features: {
      allowDateOverride: parsed.VITE_ALLOW_DATE_OVERRIDE ?? env.DEV,
      allowPlaybackSimulation: parsed.VITE_ALLOW_PLAYBACK_SIMULATION ?? env.DEV,
    },
  };
}
