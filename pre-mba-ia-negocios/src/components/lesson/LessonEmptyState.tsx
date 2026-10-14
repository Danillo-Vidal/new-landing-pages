import { CalendarClock } from 'lucide-react';

import { uiText } from '@/content/ui-text.ts';
import { formatLongDate } from '@/lib/format-date.ts';

interface LessonEmptyStateProps {
  /** Next known release; `null` when releases depend on the enrollment date. */
  readonly nextReleaseAt: Date | null;
  readonly timeZone: string;
}

/** Shown in place of the lesson panel while no lesson is released yet. */
export function LessonEmptyState({ nextReleaseAt, timeZone }: LessonEmptyStateProps) {
  const copy = uiText.lessonPanel.emptyState;
  return (
    <section className="flex flex-col items-center rounded-card border border-neutral-200 bg-white px-6 py-16 text-center shadow-soft">
      <span className="grid size-14 place-items-center rounded-full bg-brand-50 text-brand-700">
        <CalendarClock aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-5 text-xl font-bold tracking-[-0.02em] text-ink-950">{copy.title}</h2>
      <p className="mt-2 max-w-md text-neutral-600">
        {nextReleaseAt
          ? copy.firstReleaseOn(formatLongDate(nextReleaseAt, timeZone))
          : copy.awaitingEnrollment}
      </p>
    </section>
  );
}
