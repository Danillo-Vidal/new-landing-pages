import type { AccessContext } from '@/domain/types.ts';
import type { Clock } from '@/services/clock.ts';

import type { AccessProvider } from './AccessProvider.ts';

/**
 * Phase 1: no learner identity, no enrollment date. Lessons with `fixed_date` work normally;
 * lessons with `enrollment_offset` stay locked ("Liberação conforme a data da sua inscrição").
 */
export class StaticAccessProvider implements AccessProvider {
  private readonly clock: Clock;

  constructor(clock: Clock) {
    this.clock = clock;
  }

  getAccessContext(): Promise<AccessContext> {
    return Promise.resolve({ userId: null, enrollmentDate: null, now: this.clock.now() });
  }
}
