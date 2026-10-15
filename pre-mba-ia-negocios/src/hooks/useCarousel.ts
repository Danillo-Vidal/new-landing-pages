import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  CAROUSEL_TOLERANCE_PX,
  type CarouselNav,
  computeCarouselNav,
} from '@/domain/carousel-nav.ts';

/** Same media query as the `desk:` variant in index.css: arrows-only carousel on desktop. */
export const DESKTOP_QUERY = '(min-width: 64rem) and (pointer: fine)';

const SETTLE_MS = 700; // fallback for browsers without the "scrollend" event
const ANNOUNCE_DEBOUNCE_MS = 300;
const NO_NAV: CarouselNav = { canPrev: false, canNext: false };

export interface CarouselPosition {
  readonly from: number;
  readonly to: number;
  readonly total: number;
}

function subscribeDesktop(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener('change', onChange);
  return () => {
    media.removeEventListener('change', onChange);
  };
}

const readDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

/** `true` on desktop with a mouse (arrows-only carousel); updates on media changes. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribeDesktop, readDesktop);
}

const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

const itemsOf = (track: HTMLElement) => [...track.children] as HTMLElement[];
const paddingOf = (track: HTMLElement) =>
  Number.parseFloat(getComputedStyle(track).paddingLeft) || 0;
/** Scroll position that aligns the item with the start of the visible area. */
const startOf = (track: HTMLElement, item: HTMLElement) => item.offsetLeft - paddingOf(track);
const visibleWidthOf = (track: HTMLElement) => track.clientWidth - 2 * paddingOf(track);

function isFullyVisible(track: HTMLElement, item: HTMLElement): boolean {
  const start = startOf(track, item);
  return (
    start >= track.scrollLeft - CAROUSEL_TOLERANCE_PX &&
    start + item.offsetWidth <= track.scrollLeft + visibleWidthOf(track) + CAROUSEL_TOLERANCE_PX
  );
}

function visiblePosition(track: HTMLElement): CarouselPosition | null {
  const visible = itemsOf(track).flatMap((item, index) =>
    isFullyVisible(track, item) ? [index + 1] : [],
  );
  const [from] = visible;
  const to = visible.at(-1);
  return from === undefined || to === undefined ? null : { from, to, total: track.children.length };
}

/**
 * Card carousel: arrow state (scroll + ResizeObserver), one card per arrow click computed from a
 * target index (fast clicks never skip), minimal scroll to show a card, and the position text
 * announced only after an arrow action.
 */
export function useCarousel(
  trackRef: RefObject<HTMLElement | null>,
  isActive: boolean,
  itemCount: number,
) {
  const [nav, setNav] = useState<CarouselNav>(NO_NAV);
  const [position, setPosition] = useState<CarouselPosition | null>(null);
  const targetIndex = useRef<number | null>(null);
  const announcePending = useRef(false);
  const settleTimer = useRef<number | undefined>(undefined);
  const announceTimer = useRef<number | undefined>(undefined);
  const previousCount = useRef(itemCount);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const next = track && isActive ? computeCarouselNav(track) : NO_NAV;
    setNav((current) =>
      current.canPrev === next.canPrev && current.canNext === next.canNext ? current : next,
    );
  }, [isActive, trackRef]);

  const settle = useCallback(() => {
    window.clearTimeout(settleTimer.current);
    targetIndex.current = null;
    measure();
    if (!announcePending.current) return;
    announcePending.current = false;
    window.clearTimeout(announceTimer.current);
    announceTimer.current = window.setTimeout(() => {
      const track = trackRef.current;
      if (track) setPosition(visiblePosition(track));
    }, ANNOUNCE_DEBOUNCE_MS);
  }, [measure, trackRef]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };
    const observer = new ResizeObserver(() => {
      measure();
    });
    track.addEventListener('scroll', handleScroll, { passive: true });
    track.addEventListener('scrollend', settle);
    observer.observe(track);
    const initialFrame = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(initialFrame);
      track.removeEventListener('scroll', handleScroll);
      track.removeEventListener('scrollend', settle);
      observer.disconnect();
    };
  }, [measure, settle, trackRef]);

  // The reward card left (journey reset, "Desmarcar"): back to the start of the track.
  useEffect(() => {
    if (itemCount < previousCount.current && trackRef.current) trackRef.current.scrollLeft = 0;
    previousCount.current = itemCount;
  }, [itemCount, trackRef]);

  useEffect(
    () => () => {
      window.clearTimeout(settleTimer.current);
      window.clearTimeout(announceTimer.current);
    },
    [],
  );

  const step = useCallback(
    (direction: -1 | 1) => {
      const track = trackRef.current;
      if (!track || !isActive) return;
      const current = computeCarouselNav(track);
      if (direction < 0 ? !current.canPrev : !current.canNext) return; // end: no-op
      const items = itemsOf(track);
      const firstVisible = items.findIndex(
        (item) => startOf(track, item) >= track.scrollLeft - CAROUSEL_TOLERANCE_PX,
      );
      const from = targetIndex.current ?? (firstVisible === -1 ? items.length - 1 : firstVisible);
      const target = Math.min(Math.max(from + direction, 0), items.length - 1);
      const targetItem = items[target];
      if (!targetItem) return;
      targetIndex.current = target;
      announcePending.current = true;
      track.scrollTo({ left: startOf(track, targetItem), behavior: scrollBehavior() });
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(settle, SETTLE_MS);
    },
    [isActive, settle, trackRef],
  );

  /** Minimal horizontal scroll (never the page) so the item is fully visible. */
  const ensureVisible = useCallback(
    (item: HTMLElement) => {
      const track = trackRef.current;
      if (!track || !isActive || isFullyVisible(track, item)) return;
      const start = startOf(track, item);
      const left =
        start < track.scrollLeft ? start : start + item.offsetWidth - visibleWidthOf(track);
      track.scrollTo({ left, behavior: scrollBehavior() });
    },
    [isActive, trackRef],
  );

  // Tab into a card outside the view brings it fully into view (keyboard focus only: the
  // programmatic focus after an unlock must not undo the reveal scroll).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handleFocusIn = (event: FocusEvent) => {
      const { target } = event;
      if (!(target instanceof HTMLElement) || !target.matches(':focus-visible')) return;
      const item = target.closest('li');
      if (item) ensureVisible(item);
    };
    track.addEventListener('focusin', handleFocusIn);
    return () => {
      track.removeEventListener('focusin', handleFocusIn);
    };
  }, [ensureVisible, trackRef]);

  /** Shows the last card (the reward) if it is not fully visible yet. */
  const revealLast = useCallback(() => {
    const track = trackRef.current;
    const last = track?.lastElementChild;
    if (!track || !(last instanceof HTMLElement) || isFullyVisible(track, last)) return;
    track.scrollTo({ left: track.scrollWidth - track.clientWidth, behavior: scrollBehavior() });
  }, [trackRef]);

  return { nav, position, step, ensureVisible, revealLast };
}
