import { CircleCheck, CirclePlay, Lock, LockOpen, type LucideIcon } from 'lucide-react';

import { uiText } from '@/content/ui-text.ts';
import { type LessonButtonLabel, resolveButtonLabel } from '@/domain/lesson-button-label.ts';
import type { LessonId, LessonState, LessonStatus, UnlockTrigger } from '@/domain/types.ts';
import { cn } from '@/lib/cn.ts';

import { describeLessonState } from './describe-lesson-state.ts';

type CardVisual = 'locked' | 'ready' | 'available' | 'selected' | 'completed';

const CARD_CLASS: Record<CardVisual, string> = {
  locked: 'cursor-not-allowed border-neutral-200 bg-white/60',
  ready:
    'border-brand-600 bg-white hover:-translate-y-0.5 hover:border-brand-600 hover:shadow-lift',
  available:
    'border-neutral-200 bg-white hover:-translate-y-0.5 hover:border-brand-600 hover:shadow-lift',
  completed:
    'border-neutral-200 bg-white hover:-translate-y-0.5 hover:border-brand-600 hover:shadow-lift',
  selected: 'border-brand-600 bg-brand-50 shadow-soft ring-1 ring-brand-600',
};

const PILL_CLASS: Record<LessonButtonLabel, string> = {
  locked: 'bg-neutral-100 text-neutral-600',
  ready: 'cta-pulse bg-brand-700 text-white',
  unlocked: 'bg-brand-700 text-white',
  completed: 'bg-brand-50 text-brand-700 ring-1 ring-brand-100',
  viewing: 'bg-white text-brand-700 ring-1 ring-brand-200',
};

const ICON_CLASS: Record<LessonStatus, string> = {
  locked: 'bg-neutral-100 text-neutral-500',
  ready: 'bg-brand-50 text-brand-700',
  available: 'bg-brand-50 text-brand-700',
  in_progress: 'bg-brand-50 text-brand-700',
  completed: 'bg-brand-600 text-white',
};

const STATUS_ICON = {
  locked: Lock,
  ready: LockOpen,
  available: CirclePlay,
  in_progress: CirclePlay,
  completed: CircleCheck,
} as const;

const PILL_ICON: Partial<Record<LessonButtonLabel, LucideIcon>> = {
  locked: Lock,
  ready: LockOpen,
  completed: CircleCheck,
};

interface LessonCardProps {
  readonly state: LessonState;
  readonly isSelected: boolean;
  readonly timeZone: string;
  readonly trigger: UnlockTrigger;
  readonly isPreviousOpen: boolean;
  /** Plays the one-off "just unlocked" highlight. */
  readonly isHighlighted: boolean;
  readonly panelId: string;
  readonly onSelect: (lessonId: LessonId) => void;
  readonly onUnlock: (lessonId: LessonId) => void;
  readonly onHighlightEnd: () => void;
}

export function LessonCard({
  state,
  isSelected,
  timeZone,
  trigger,
  isPreviousOpen,
  isHighlighted,
  panelId,
  onSelect,
  onUnlock,
  onHighlightEnd,
}: LessonCardProps) {
  const { lesson, status } = state;
  const isLocked = status === 'locked';
  const isReady = status === 'ready';
  const label = resolveButtonLabel(status, isSelected);
  const visual: CardVisual = isSelected
    ? 'selected'
    : status === 'in_progress'
      ? 'available'
      : status;
  const StatusIcon = STATUS_ICON[status];
  const PillIcon = PILL_ICON[label];
  const copy = uiText.lessonCard;

  const handleClick = isLocked
    ? undefined
    : () => {
        if (isReady) onUnlock(lesson.id);
        else onSelect(lesson.id);
      };

  return (
    <button
      type="button"
      data-lesson-id={lesson.id}
      data-status={status}
      aria-disabled={isLocked || undefined}
      aria-current={isSelected || undefined}
      aria-controls={isLocked || isReady ? undefined : panelId}
      onClick={handleClick}
      onAnimationEnd={(event) => {
        if (event.animationName === 'card-pop') onHighlightEnd();
      }}
      className={cn(
        'flex h-full w-full flex-col rounded-card border p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out',
        CARD_CLASS[visual],
        isHighlighted && 'card-pop',
      )}
    >
      <span className={cn('grid size-9 place-items-center rounded-full', ICON_CLASS[status])}>
        <StatusIcon aria-hidden="true" className="size-[18px]" />
      </span>
      <span className="mt-4 text-[11px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
        {copy.lessonLabel(lesson.order)}
      </span>
      <span
        className={cn(
          'mt-1 line-clamp-2 text-[15px] leading-snug font-semibold tracking-[-0.01em]',
          isLocked ? 'text-neutral-600' : 'text-ink-950',
        )}
      >
        {lesson.title}
      </span>
      <span className="mt-1.5 text-xs text-neutral-600">
        {describeLessonState(state, { timeZone, trigger, isPreviousOpen })}
      </span>
      <span className="mt-auto block w-full pt-4">
        <span
          className={cn(
            'relative flex w-full items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold',
            PILL_CLASS[label],
          )}
        >
          {PillIcon && <PillIcon aria-hidden="true" className="size-3" />}
          {copy.badge[label]}
        </span>
      </span>
    </button>
  );
}
