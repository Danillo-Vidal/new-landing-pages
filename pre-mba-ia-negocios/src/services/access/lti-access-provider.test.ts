import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFixedClock } from '../clock.ts';
import { LTI_RESULT_PARAM, LtiAccessProvider, readLtiResult } from './LtiAccessProvider.ts';

const NOW = new Date('2026-10-20T15:00:00.000Z');

/** Same encoding as the backend: base64url of the JSON, without padding. */
const encode = (value: unknown) =>
  btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

const hashOf = (value: unknown) => `#${LTI_RESULT_PARAM}=${encode(value)}`;

describe('readLtiResult', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the result the backend appends to the address', () => {
    expect(
      readLtiResult(hashOf({ v: 1, status: 'enrolled', enrolledAt: '2026-10-13T12:00:00.000Z' })),
    ).toEqual({ v: 1, status: 'enrolled', enrolledAt: '2026-10-13T12:00:00.000Z' });
  });

  it('is null without the parameter', () => {
    expect(readLtiResult('')).toBeNull();
    expect(readLtiResult('#aula-2')).toBeNull();
  });

  it('ignores (and warns about) a broken or unexpected value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(readLtiResult(`#${LTI_RESULT_PARAM}=@@@`)).toBeNull();
    expect(readLtiResult(hashOf({ v: 2, status: 'enrolled', enrolledAt: null }))).toBeNull();
    expect(readLtiResult(hashOf({ v: 1, status: 'admin', enrolledAt: null }))).toBeNull();
    expect(readLtiResult(hashOf({ v: 1, status: 'enrolled', enrolledAt: 'ontem' }))).toBeNull();
    expect(warn).toHaveBeenCalledTimes(4);
  });
});

describe('LtiAccessProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the enrollment date and the clock', async () => {
    const provider = new LtiAccessProvider(
      { v: 1, status: 'enrolled', enrolledAt: '2026-10-13T12:00:00.000Z' },
      createFixedClock(NOW),
    );
    await expect(provider.getAccessContext()).resolves.toEqual({
      userId: null,
      enrollmentDate: new Date('2026-10-13T12:00:00.000Z'),
      now: NOW,
    });
  });

  it('has no date when the learner is not enrolled or D2L could not be read', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    for (const status of ['not_enrolled', 'unavailable'] as const) {
      const provider = new LtiAccessProvider(
        { v: 1, status, enrolledAt: null },
        createFixedClock(NOW),
      );
      await expect(provider.getAccessContext()).resolves.toMatchObject({ enrollmentDate: null });
    }
  });
});
