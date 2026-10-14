import { describe, expect, it } from 'vitest';

import { createFixedClock } from '../clock.ts';
import { AccessProviderNotImplementedError, ApiAccessProvider } from './ApiAccessProvider.ts';
import { StaticAccessProvider } from './StaticAccessProvider.ts';

describe('StaticAccessProvider', () => {
  it('provides an anonymous context with the clock time', async () => {
    const now = new Date('2026-10-27T03:00:00.000Z');
    await expect(
      new StaticAccessProvider(createFixedClock(now)).getAccessContext(),
    ).resolves.toEqual({
      userId: null,
      enrollmentDate: null,
      now,
    });
  });
});

describe('ApiAccessProvider (phase 2 stub)', () => {
  it('fails loudly with the expected endpoint until it is implemented', async () => {
    const provider = new ApiAccessProvider({
      baseUrl: 'https://api.exemplo.com/',
      journeyId: 'pre-mba',
    });
    await expect(provider.getAccessContext()).rejects.toThrow(AccessProviderNotImplementedError);
    await expect(provider.getAccessContext()).rejects.toThrow(
      'GET https://api.exemplo.com/api/v1/journeys/pre-mba/access',
    );
  });
});
