import { z } from 'zod';

import type { AccessContext } from '@/domain/types.ts';
import type { Clock } from '@/services/clock.ts';

import type { AccessProvider } from './AccessProvider.ts';

/**
 * Result sent by the LTI 1.3 backend (xpe-lti-jornada) when D2L opens the journey:
 *
 *   PAGE_URL#xpe-lti=<base64url of { v: 1, status, enrolledAt }>
 *
 * The backend checked the signed D2L launch and read the enrollment date with its own service
 * account; the page only receives the learner's own date (no name, e-mail or user id).
 * Kept in the address on purpose: reloading the page keeps the same result.
 */
export const LTI_RESULT_PARAM = 'xpe-lti';

const isoInstant = z
  .string()
  .refine((value) => Number.isFinite(Date.parse(value)), { error: 'Data inválida.' });

const ltiResultSchema = z.object({
  v: z.literal(1),
  status: z.enum(['enrolled', 'not_enrolled', 'unavailable']),
  enrolledAt: isoInstant.nullable(),
});

export type LtiResult = z.infer<typeof ltiResultSchema>;

/** Reads the result from `location.hash`; `null` when absent or malformed. */
export function readLtiResult(hash: string): LtiResult | null {
  const encoded = new URLSearchParams(hash.replace(/^#/, '')).get(LTI_RESULT_PARAM);
  if (!encoded) return null;
  try {
    const json: unknown = JSON.parse(atob(encoded.replaceAll('-', '+').replaceAll('_', '/')));
    const parsed = ltiResultSchema.safeParse(json);
    if (parsed.success) return parsed.data;
  } catch {
    // Falls through to the warning below.
  }
  console.warn('[acesso] Resultado do LTI inválido no endereço; seguindo sem a data de inscrição.');
  return null;
}

export class LtiAccessProvider implements AccessProvider {
  private readonly enrollmentDate: Date | null;
  private readonly clock: Clock;

  constructor(result: LtiResult, clock: Clock) {
    this.clock = clock;
    this.enrollmentDate =
      result.status === 'enrolled' && result.enrolledAt !== null
        ? new Date(Date.parse(result.enrolledAt))
        : null;
    if (result.status === 'unavailable') {
      console.warn('[acesso] O backend LTI não conseguiu ler a inscrição no D2L.');
    }
  }

  getAccessContext(): Promise<AccessContext> {
    return Promise.resolve({
      userId: null,
      enrollmentDate: this.enrollmentDate,
      now: this.clock.now(),
    });
  }
}
