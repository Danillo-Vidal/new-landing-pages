import { z } from 'zod';

import type { AccessProviderKind } from '@/services/access/AccessProvider.ts';

/** Runtime configuration, read ONLY from build-time environment variables (see .env.example). */
export interface AppConfig {
  readonly accessProvider: AccessProviderKind;
  readonly accessApiBaseUrl: string;
  /** Exact origin of Brightspace, the only parent allowed to answer the widget bridge. */
  readonly d2lOrigin: string;
  /** `?d2l=1` in the iframe URL turns the D2L widget bridge on (docs/D2L_WIDGET.md). */
  readonly d2lBridgeParam: string;
  readonly dateOverrideParam: string;
  /** `?speed=60` makes the clock 60× faster (same flag as `?today=`). */
  readonly clockSpeedParam: string;
  readonly features: {
    /** Enables `?today=AAAA-MM-DD` and `?speed=N`. Default: on in development, off in production. */
    readonly allowDateOverride: boolean;
  };
}

const DEFAULT_D2L_ORIGIN = 'https://ava.xpeducacao.com.br';

const booleanFlag = z.enum(['true', 'false']).transform((value) => value === 'true');

const envSchema = z.object({
  VITE_ACCESS_PROVIDER: z.enum(['static', 'api']).default('static'),
  VITE_ACCESS_API_BASE_URL: z.string().trim().default(''),
  VITE_D2L_ORIGIN: z
    .union([z.literal(''), z.url()])
    .default('')
    .transform((value) => (value === '' ? DEFAULT_D2L_ORIGIN : new URL(value).origin)),
  VITE_ALLOW_DATE_OVERRIDE: z
    .union([z.literal('').transform(() => undefined), booleanFlag])
    .optional(),
});

export function readAppConfig(env: ImportMetaEnv & { readonly DEV: boolean }): AppConfig {
  const parsed = envSchema.parse(env);
  return {
    accessProvider: parsed.VITE_ACCESS_PROVIDER,
    accessApiBaseUrl: parsed.VITE_ACCESS_API_BASE_URL,
    d2lOrigin: parsed.VITE_D2L_ORIGIN,
    d2lBridgeParam: 'd2l',
    dateOverrideParam: 'today',
    clockSpeedParam: 'speed',
    features: {
      allowDateOverride: parsed.VITE_ALLOW_DATE_OVERRIDE ?? env.DEV,
    },
  };
}
