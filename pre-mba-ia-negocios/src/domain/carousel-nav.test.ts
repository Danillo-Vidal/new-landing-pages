import { describe, expect, it } from 'vitest';

import { computeCarouselNav } from './carousel-nav.ts';

const nav = (scrollLeft: number, clientWidth: number, scrollWidth: number) =>
  computeCarouselNav({ scrollLeft, clientWidth, scrollWidth });

describe('computeCarouselNav', () => {
  it('start, middle and end', () => {
    expect(nav(0, 800, 1200)).toEqual({ canPrev: false, canNext: true });
    expect(nav(200, 800, 1200)).toEqual({ canPrev: true, canNext: true });
    expect(nav(400, 800, 1200)).toEqual({ canPrev: true, canNext: false });
  });

  it('tolerates subpixel positions', () => {
    expect(nav(398.6, 800.4, 1200)).toEqual({ canPrev: true, canNext: false });
    expect(nav(1.2, 800, 1200).canPrev).toBe(false);
  });

  it('has nothing to navigate when everything fits', () => {
    expect(nav(0, 800, 600)).toEqual({ canPrev: false, canNext: false });
  });
});
