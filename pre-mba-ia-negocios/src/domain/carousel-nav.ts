/** Tolerance for subpixel widths (zoom, high-density screens). */
export const CAROUSEL_TOLERANCE_PX = 2;

export interface CarouselMetrics {
  readonly scrollLeft: number;
  readonly clientWidth: number;
  readonly scrollWidth: number;
}

export interface CarouselNav {
  readonly canPrev: boolean;
  readonly canNext: boolean;
}

/** Arrow state of the card carousel. No loop: arrows are inactive at the ends. */
export function computeCarouselNav({
  scrollLeft,
  clientWidth,
  scrollWidth,
}: CarouselMetrics): CarouselNav {
  return {
    canPrev: scrollLeft > CAROUSEL_TOLERANCE_PX,
    canNext: scrollLeft + clientWidth < scrollWidth - CAROUSEL_TOLERANCE_PX,
  };
}
