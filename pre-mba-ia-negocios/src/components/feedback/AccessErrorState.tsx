import { RotateCw, WifiOff } from 'lucide-react';

import { Button } from '@/components/ui/button.tsx';
import { uiText } from '@/content/ui-text.ts';

export function AccessErrorState({ onRetry }: { readonly onRetry: () => void }) {
  const copy = uiText.errors;
  return (
    <section
      role="alert"
      className="flex flex-col items-center rounded-card border border-neutral-200 bg-white px-6 py-16 text-center shadow-soft"
    >
      <WifiOff aria-hidden="true" className="size-8 text-neutral-500" />
      <h2 className="mt-4 text-xl font-bold tracking-[-0.02em] text-ink-950">{copy.accessTitle}</h2>
      <p className="mt-2 max-w-md text-neutral-600">{copy.accessDescription}</p>
      <Button variant="primary" className="mt-6" onClick={onRetry}>
        <RotateCw aria-hidden="true" />
        {copy.retry}
      </Button>
    </section>
  );
}
