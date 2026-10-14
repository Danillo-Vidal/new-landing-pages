import type { ReactNode } from 'react';

import { uiText } from '@/content/ui-text.ts';
import { ANCHORS } from '@/lib/anchors.ts';

interface PageShellProps {
  /** Optional strip above everything (e.g. date simulator notice). */
  readonly banner?: ReactNode;
  readonly header?: ReactNode;
  readonly hero: ReactNode;
  readonly children: ReactNode;
}

export function PageShell({ banner, header, hero, children }: PageShellProps) {
  return (
    <div className="min-h-dvh bg-neutral-50">
      <a
        href={`#${ANCHORS.main}`}
        className="sr-only rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-lift focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
      >
        {uiText.page.skipToContent}
      </a>
      {banner}
      {header}
      {hero}
      <main
        id={ANCHORS.main}
        tabIndex={-1}
        className="mx-auto w-full max-w-page px-4 pt-8 pb-20 outline-none sm:px-6 md:pt-12"
      >
        {children}
      </main>
    </div>
  );
}
