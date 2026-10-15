import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { uiText } from '@/content/ui-text.ts';
import type { CarouselNav } from '@/domain/carousel-nav.ts';
import type { CarouselPosition } from '@/hooks/useCarousel.ts';
import { cn } from '@/lib/cn.ts';

const ARROW_CLASS =
  'grid size-10 place-items-center rounded-full border border-neutral-200 bg-white/95 text-ink-950 shadow-soft backdrop-blur-sm transition-[opacity,transform] duration-150 ease-out aria-disabled:cursor-default aria-disabled:bg-neutral-100 aria-disabled:text-neutral-400 aria-disabled:opacity-50 aria-disabled:shadow-none [&:not([aria-disabled=true])]:active:scale-95';
const FADE_CLASS =
  'pointer-events-none absolute inset-y-0 z-10 w-8 transition-opacity duration-200 ease-out';

interface JourneyCarouselProps {
  readonly isActive: boolean;
  readonly isDesktop: boolean;
  readonly nav: CarouselNav;
  readonly position: CarouselPosition | null;
  readonly trackId: string;
  readonly onStep: (direction: -1 | 1) => void;
  readonly children: ReactNode;
}

/**
 * Arrow bar ABOVE the cards (never over them) + edge fades + position announcement.
 * When inactive (desktop without the reward card), it renders only the cards, as before.
 */
export function JourneyCarousel(props: JourneyCarouselProps) {
  const { isActive, isDesktop, nav, position, trackId, onStep, children } = props;
  const copy = uiText.carousel;
  const hasOverflow = isActive && (nav.canPrev || nav.canNext);

  const arrow = (direction: -1 | 1) => {
    const isDisabled = direction < 0 ? !nav.canPrev : !nav.canNext;
    const Icon = direction < 0 ? ChevronLeft : ChevronRight;
    return (
      <button
        type="button"
        aria-label={direction < 0 ? copy.prev : copy.next}
        aria-controls={trackId}
        aria-disabled={isDisabled}
        onClick={() => onStep(direction)}
        className={ARROW_CLASS}
      >
        <Icon aria-hidden="true" className="size-5" />
      </button>
    );
  };

  return (
    <div
      role={isActive ? 'region' : undefined}
      aria-roledescription={isActive ? copy.roleDescription : undefined}
      aria-label={isActive ? copy.regionLabel : undefined}
      className="flex flex-col gap-2"
    >
      {hasOverflow && (
        <p className="text-center text-xs text-neutral-600">
          {isDesktop ? copy.hintArrows : copy.hintTouch}
        </p>
      )}
      <div className="relative">
        {isActive && (
          <>
            <span
              aria-hidden="true"
              className={cn(
                FADE_CLASS,
                '-left-4 bg-linear-to-r from-neutral-50 to-transparent sm:-left-6 desk:-left-2',
                !nav.canPrev && 'opacity-0',
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                FADE_CLASS,
                '-right-4 bg-linear-to-l from-neutral-50 to-transparent sm:-right-6 desk:-right-2',
                !nav.canNext && 'opacity-0',
              )}
            />
          </>
        )}
        {hasOverflow && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between">
            <span className="pointer-events-auto -ml-7">{arrow(-1)}</span>
            <span className="pointer-events-auto -mr-7">{arrow(1)}</span>
          </div>
        )}
        {children}
      </div>
      <p className="sr-only" aria-live="polite">
        {position && copy.position(position.from, position.to, position.total)}
      </p>
    </div>
  );
}
