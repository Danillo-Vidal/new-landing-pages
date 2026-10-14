import type { AccessContext } from '@/domain/types.ts';

import type { AccessProvider } from './AccessProvider.ts';

/**
 * Response of `GET {baseUrl}/api/v1/journeys/{journeyId}/access` (contract in docs/API_ROADMAP.md).
 * All dates are ISO-8601 strings with offset.
 */
export interface AccessApiResponse {
  readonly user: { readonly id: string; readonly displayName: string };
  readonly enrollmentDate: string;
  /** Authoritative "now": the device clock must not be able to unlock lessons. */
  readonly serverTime: string;
}

export interface ApiAccessProviderOptions {
  readonly baseUrl: string;
  readonly journeyId: string;
}

export class AccessProviderNotImplementedError extends Error {
  constructor(endpoint: string) {
    super(
      `ApiAccessProvider ainda não foi implementado (fase 2). Endpoint previsto: GET ${endpoint}. ` +
        'Use VITE_ACCESS_PROVIDER=static ou siga docs/API_ROADMAP.md.',
    );
    this.name = 'AccessProviderNotImplementedError';
  }
}

/**
 * PHASE 2 STUB — selected with `VITE_ACCESS_PROVIDER=api`. Implementation checklist:
 *
 * 1. `fetch(this.endpoint, { credentials: 'include', signal })` with a timeout (AbortController).
 * 2. Validate the JSON with Zod against `AccessApiResponse`; reject on mismatch.
 * 3. Memoize the first successful response (one request per page load; Redis caches server-side).
 * 4. Build `now` from `serverTime` + elapsed time (`createShiftedClock(systemClock, serverTime)`).
 * 5. Return `{ userId: user.id, enrollmentDate: new Date(enrollmentDate), now }`.
 */
export class ApiAccessProvider implements AccessProvider {
  private readonly endpoint: string;

  constructor({ baseUrl, journeyId }: ApiAccessProviderOptions) {
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    this.endpoint = `${normalizedBase}/api/v1/journeys/${encodeURIComponent(journeyId)}/access`;
  }

  getAccessContext(): Promise<AccessContext> {
    return Promise.reject(new AccessProviderNotImplementedError(this.endpoint));
  }
}
