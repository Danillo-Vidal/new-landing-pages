import { CalendarClock } from 'lucide-react';

import { uiText } from '@/content/ui-text.ts';
import { formatLongDate } from '@/lib/format-date.ts';

interface DateOverrideBannerProps {
  readonly date: Date;
  readonly timeZone: string;
}

/** Visible reminder that `?today=` is simulating a date (development / QA only). */
export function DateOverrideBanner({ date, timeZone }: DateOverrideBannerProps) {
  return (
    <div role="status" className="bg-ink-800 text-white">
      <p className="mx-auto flex max-w-page flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-xs sm:px-6">
        <CalendarClock aria-hidden="true" className="size-4 shrink-0 text-brand-300" />
        <strong className="font-semibold">
          {uiText.dateOverride.message(formatLongDate(date, timeZone))}
        </strong>
        <span className="text-neutral-300">{uiText.dateOverride.hint}</span>
      </p>
    </div>
  );
}
