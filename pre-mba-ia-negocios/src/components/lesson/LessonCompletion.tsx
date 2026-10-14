import { Check, CircleCheck } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button.tsx';
import { uiText } from '@/content/ui-text.ts';

interface LessonCompletionProps {
  readonly isCompleted: boolean;
  readonly completionThreshold: number;
  /** `features.allowManualComplete`: shows "Marcar como assistida" / "Desmarcar". */
  readonly allowManualComplete: boolean;
  readonly onChange: (completed: boolean) => void;
}

/** Completion status, plus the optional manual fallback (which also allows undoing). */
export function LessonCompletion({
  isCompleted,
  completionThreshold,
  allowManualComplete,
  onChange,
}: LessonCompletionProps) {
  const copy = uiText.completion;
  const markRef = useRef<HTMLButtonElement>(null);
  const unmarkRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreFocus = useRef(false);

  // The clicked button is replaced by its counterpart: keep keyboard focus in place.
  useEffect(() => {
    if (!shouldRestoreFocus.current) return;
    shouldRestoreFocus.current = false;
    (isCompleted ? unmarkRef : markRef).current?.focus();
  }, [isCompleted]);

  const handleChange = (completed: boolean) => {
    shouldRestoreFocus.current = true;
    onChange(completed);
  };

  return (
    <div className="flex flex-col gap-3 rounded-tile bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-neutral-600">{copy.hint(Math.round(completionThreshold * 100))}</p>
      {isCompleted ? (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            <CircleCheck aria-hidden="true" className="size-4" />
            {copy.watched}
          </span>
          {allowManualComplete && (
            <Button
              ref={unmarkRef}
              variant="ghost"
              size="sm"
              aria-label={copy.unmarkLabel}
              onClick={() => handleChange(false)}
            >
              {copy.unmark}
            </Button>
          )}
        </div>
      ) : (
        allowManualComplete && (
          <Button ref={markRef} variant="primary" onClick={() => handleChange(true)}>
            <Check aria-hidden="true" />
            {copy.markAsWatched}
          </Button>
        )
      )}
    </div>
  );
}
