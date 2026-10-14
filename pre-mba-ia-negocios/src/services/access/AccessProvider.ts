import type { AccessContext } from '@/domain/types.ts';

export type AccessProviderKind = 'static' | 'api';

/**
 * Port that tells the app WHO is watching and WHEN it is (`AccessContext`).
 *
 * It is called on page load and again whenever a release moment is reached, so
 * implementations must be cheap to call repeatedly: cache the learner identity and
 * compute `now` from a Clock instead of re-fetching.
 *
 * Implementations: `StaticAccessProvider` (phase 1) and `ApiAccessProvider` (phase 2).
 * Switch with `VITE_ACCESS_PROVIDER=static|api` — no component changes needed.
 */
export interface AccessProvider {
  getAccessContext(): Promise<AccessContext>;
}
