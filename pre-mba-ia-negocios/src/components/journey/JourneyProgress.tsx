import type { ReactNode } from 'react';

import { uiText } from '@/content/ui-text.ts';
import type {
  JourneyProgress as Progress,
  LessonState,
  LessonStatus,
  UnlockTrigger,
} from '@/domain/types.ts';
import { ANCHORS } from '@/lib/anchors.ts';
import { cn } from '@/lib/cn.ts';

const SEGMENT_CLASS: Record<LessonStatus, string> = {
  locked: 'bg-neutral-200',
  ready: 'bg-neutral-200',
  available: 'bg-brand-200',
  in_progress: 'bg-brand-200',
  completed: 'bg-brand-600',
};

const LEGEND_ORDER = ['completed', 'available', 'locked'] as const;

interface JourneyProgressProps {
  readonly states: readonly LessonState[];
  readonly progress: Progress;
  readonly trigger: UnlockTrigger;
  /** Extra controls next to the summary badge (e.g. the sound toggle). */
  readonly actions?: ReactNode;
}

/** Section heading + live summary badge + one bar segment per lesson. */
export function JourneyProgress({ states, progress, trigger, actions }: JourneyProgressProps) {
  const copy = uiText.journey;
  const { released, total, completed } = progress;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2
            id={ANCHORS.journeyHeading}
            className="text-xl font-bold tracking-[-0.02em] text-ink-950 md:text-2xl"
          >
            {copy.heading}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">{copy.subheading[trigger]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p
            aria-live="polite"
            aria-atomic="true"
            className="rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-100"
          >
            {copy.progressSummary(released, total, completed)}
          </p>
          {actions}
        </div>
      </div>

      <div
        role="progressbar"
        aria-label={copy.progressLabel}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-valuetext={copy.progressValueText(released, total, completed)}
        className="flex gap-1.5"
      >
        {states.map((state) => (
          <span
            key={state.lesson.id}
            data-status={state.status}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors duration-300 ease-out',
              SEGMENT_CLASS[state.status],
            )}
          />
        ))}
      </div>

      <ul aria-hidden="true" className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-600">
        {LEGEND_ORDER.map((status) => (
          <li key={status} className="flex items-center gap-2">
            <span className={cn('size-2 rounded-full', SEGMENT_CLASS[status])} />
            {copy.legend[status]}
          </li>
        ))}
      </ul>
    </div>
  );
}
