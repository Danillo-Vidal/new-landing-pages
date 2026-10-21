import { uiText } from '@/content/ui-text.ts';
import type {
  JourneyProgress as Progress,
  LessonState,
  LessonStatus,
  UnlockTrigger,
} from '@/domain/types.ts';
import { ANCHORS } from '@/lib/anchors.ts';
import { cn } from '@/lib/cn.ts';
import { formatLongDate } from '@/lib/format-date.ts';

const SEGMENT_CLASS: Record<LessonStatus, string> = {
  locked: 'bg-neutral-200',
  ready: 'bg-neutral-200',
  available: 'bg-brand-200',
  in_progress: 'bg-brand-200',
  completed: 'bg-brand-600',
};

const LEGEND_ORDER = ['completed', 'available', 'locked'] as const;

/** Reward bonus segment: exists only while the reward card exists. */
export interface ProgressBonus {
  readonly label: string;
  readonly valueText: string;
  /** Under the unlock overlay: the layout already switched, the segment is still empty. */
  readonly isAwaitingReveal: boolean;
  /** Fills together with the reward card entrance. */
  readonly isRevealing: boolean;
}

interface JourneyProgressProps {
  readonly states: readonly LessonState[];
  readonly progress: Progress;
  readonly trigger: UnlockTrigger;
  /** How lessons open: by the learner ("Liberar aula") or automatically (enrollment / dates). */
  readonly releaseMode: 'learner' | 'enrollment' | 'dates';
  /** Shown as "Inscrição em …" when lessons open from the enrollment date. */
  readonly enrollmentDate: Date | null;
  readonly timeZone: string;
  /** Appended to the help text (reward teaser); `null` = nothing. */
  readonly teaser: string | null;
  readonly bonus: ProgressBonus | null;
}

/** Section heading + live summary badge + one bar segment per lesson. */
export function JourneyProgress({
  states,
  progress,
  trigger,
  releaseMode,
  enrollmentDate,
  timeZone,
  teaser,
  bonus,
}: JourneyProgressProps) {
  const copy = uiText.journey;
  const help =
    releaseMode === 'learner' ? copy.subheading[trigger] : copy.scheduledSubheading[releaseMode];
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
          <p className="mt-1 text-sm text-neutral-600">{teaser ? `${help} ${teaser}` : help}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {releaseMode === 'enrollment' && enrollmentDate && (
            <p className="rounded-full bg-neutral-100 px-3.5 py-1.5 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200">
              {copy.enrolledOn(formatLongDate(enrollmentDate, timeZone))}
            </p>
          )}
          <p
            aria-live="polite"
            aria-atomic="true"
            className="rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-100"
          >
            {copy.progressSummary(released, total, completed)}
          </p>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label={copy.progressLabel}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-valuetext={
          bonus
            ? `${copy.progressValueText(released, total, completed)} ${bonus.valueText}`
            : copy.progressValueText(released, total, completed)
        }
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
        {/* Same width as one lesson; born full (conquered). Outside the bar values. */}
        {bonus && (
          <span
            aria-hidden="true"
            className={cn(
              'h-2 flex-1 origin-left rounded-full bg-linear-to-r from-reward-500 to-reward-600',
              bonus.isAwaitingReveal && 'bonus-awaiting',
              bonus.isRevealing && 'bonus-fill',
            )}
          />
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-1">
        <ul aria-hidden="true" className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-600">
          {LEGEND_ORDER.map((status) => (
            <li key={status} className="flex items-center gap-2">
              <span className={cn('size-2 rounded-full', SEGMENT_CLASS[status])} />
              {copy.legend[status]}
            </li>
          ))}
        </ul>
        {bonus?.label && (
          <span
            aria-hidden="true"
            className={cn(
              'ml-auto text-[11px] font-bold whitespace-nowrap text-reward-700',
              bonus.isAwaitingReveal && 'bonus-awaiting-label',
              bonus.isRevealing && 'bonus-label-in',
            )}
          >
            {bonus.label}
          </span>
        )}
      </div>
    </div>
  );
}
