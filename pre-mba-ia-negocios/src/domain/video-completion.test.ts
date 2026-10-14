import { describe, expect, it } from 'vitest';

import { hasReachedCompletion, toProgressRatio } from './video-completion.ts';

describe('toProgressRatio', () => {
  it('divides current time by duration and clamps to 0-1', () => {
    expect(toProgressRatio(45, 100)).toBe(0.45);
    expect(toProgressRatio(120, 100)).toBe(1);
    expect(toProgressRatio(-5, 100)).toBe(0);
  });

  it('returns 0 when the duration is unknown', () => {
    expect(toProgressRatio(10, 0)).toBe(0);
    expect(toProgressRatio(10, Number.NaN)).toBe(0);
  });
});

describe('hasReachedCompletion', () => {
  it('uses an inclusive threshold', () => {
    expect(hasReachedCompletion(0.89, 0.9)).toBe(false);
    expect(hasReachedCompletion(0.9, 0.9)).toBe(true);
    expect(hasReachedCompletion(1, 0.9)).toBe(true);
  });

  it('ignores invalid progress values', () => {
    expect(hasReachedCompletion(Number.NaN, 0.9)).toBe(false);
  });
});
