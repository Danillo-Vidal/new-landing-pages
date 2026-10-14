import { type RefObject, useEffect, useRef } from 'react';

import { uiText } from '@/content/ui-text.ts';
import { isLessonSelectable } from '@/domain/lesson-status.ts';
import type { LessonId, LessonState, UnlockTrigger } from '@/domain/types.ts';

import { LessonCard } from './LessonCard.tsx';

interface LessonCardListProps {
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
  const listRef = useRef<HTMLOListElement>(null);
  useScrollSelectedIntoView(listRef, selectedId);

  return (
    <ol
      ref={listRef}
      aria-label={uiText.journey.lessonListLabel}
      className="relative -mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:thin] gap-3 overflow-x-auto px-4 py-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))] lg:overflow-visible lg:px-0"
    >
      {states.map((state, index) => {
        const previous = states[index - 1];
        return (
          <li
            key={state.lesson.id}
            className="w-[72%] max-w-[17rem] shrink-0 snap-start sm:w-[42%] md:w-[30%] lg:w-auto lg:max-w-none"
          >
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
    </ol>
  );
}
