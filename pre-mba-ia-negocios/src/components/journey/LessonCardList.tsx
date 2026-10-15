import { type ReactNode, type RefObject, useEffect } from 'react';

import { uiText } from '@/content/ui-text.ts';
import { isLessonSelectable } from '@/domain/lesson-status.ts';
import type { LessonId, LessonState, UnlockTrigger } from '@/domain/types.ts';
import { cn } from '@/lib/cn.ts';

import { LessonCard } from './LessonCard.tsx';

const LIST_CLASS =
  'relative -mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:thin] gap-3 overflow-x-auto px-4 py-2 sm:-mx-6 sm:scroll-px-6 sm:px-6';
/** Desktop with a mouse and 5 cards: the original grid. */
const LIST_DESKTOP_GRID =
  'desk:mx-0 desk:grid desk:grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))] desk:overflow-visible desk:px-0';
/** Desktop with the reward card: arrows-only carousel (no wheel, trackpad or drag scroll). */
const LIST_DESKTOP_CAROUSEL = 'desk:-mx-2 desk:snap-none desk:overflow-x-hidden desk:px-2';
const ITEM_CLASS = 'w-[72%] max-w-[17rem] shrink-0 snap-start last:snap-end sm:w-[42%] md:w-[30%]';
const ITEM_DESKTOP_GRID = 'desk:w-auto desk:max-w-none';
/** 4.4 cards visible: the next one shows cut, hinting there is more. */
const ITEM_DESKTOP_CAROUSEL = 'desk:w-[calc((100%-3.4*0.75rem)/4.4)] desk:max-w-none';

interface LessonCardListProps {
  readonly listRef: RefObject<HTMLOListElement | null>;
  readonly listId: string;
  /** Desktop + reward card: the grid becomes the arrows-only carousel. */
  readonly isDesktopCarousel: boolean;
  /** Extra card after the lessons (the reward). */
  readonly trailing?: ReactNode;
  readonly states: readonly LessonState[];
  readonly selectedId: LessonId | null;
  readonly highlightedId: LessonId | null;
  readonly timeZone: string;
  readonly trigger: UnlockTrigger;
  readonly panelId: string;
  readonly onSelect: (lessonId: LessonId) => void;
  readonly onUnlock: (lessonId: LessonId) => void;
  readonly onHighlightEnd: () => void;
}

/** Keeps the selected card visible in the horizontal (mobile) scroller. */
function useScrollSelectedIntoView(
  listRef: RefObject<HTMLOListElement | null>,
  selectedId: LessonId | null,
) {
  useEffect(() => {
    const list = listRef.current;
    if (!list || selectedId === null || list.scrollWidth <= list.clientWidth) return;
    const card = list.querySelector<HTMLElement>(`[data-lesson-id="${CSS.escape(selectedId)}"]`);
    const item = card?.closest('li');
    if (!item) return;

    const isFullyVisible =
      item.offsetLeft >= list.scrollLeft &&
      item.offsetLeft + item.offsetWidth <= list.scrollLeft + list.clientWidth;
    if (isFullyVisible) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollTo({
      left: item.offsetLeft - Number.parseFloat(getComputedStyle(list).paddingLeft),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [listRef, selectedId]);
}

export function LessonCardList({
  listRef,
  listId,
  isDesktopCarousel,
  trailing,
  states,
  selectedId,
  highlightedId,
  timeZone,
  trigger,
  panelId,
  onSelect,
  onUnlock,
  onHighlightEnd,
}: LessonCardListProps) {
  useScrollSelectedIntoView(listRef, selectedId);
  const itemClass = cn(ITEM_CLASS, isDesktopCarousel ? ITEM_DESKTOP_CAROUSEL : ITEM_DESKTOP_GRID);

  return (
    <ol
      ref={listRef}
      id={listId}
      aria-label={uiText.journey.lessonListLabel}
      className={cn(LIST_CLASS, isDesktopCarousel ? LIST_DESKTOP_CAROUSEL : LIST_DESKTOP_GRID)}
    >
      {states.map((state, index) => {
        const previous = states[index - 1];
        return (
          <li key={state.lesson.id} className={itemClass}>
            <LessonCard
              state={state}
              isSelected={state.lesson.id === selectedId}
              isHighlighted={state.lesson.id === highlightedId}
              isPreviousOpen={previous !== undefined && isLessonSelectable(previous)}
              timeZone={timeZone}
              trigger={trigger}
              panelId={panelId}
              onSelect={onSelect}
              onUnlock={onUnlock}
              onHighlightEnd={onHighlightEnd}
            />
          </li>
        );
      })}
      {trailing && <li className={itemClass}>{trailing}</li>}
    </ol>
  );
}
