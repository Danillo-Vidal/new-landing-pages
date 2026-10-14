import { FileWarning } from 'lucide-react';

import type { ContentIssue } from '@/content/course.schema.ts';
import { uiText } from '@/content/ui-text.ts';

/** Friendly screen for an invalid course.json, pointing to every field with a problem. */
export function ContentErrorState({ issues }: { readonly issues: readonly ContentIssue[] }) {
  const copy = uiText.errors;
  return (
    <main className="grid min-h-dvh place-items-center bg-neutral-50 px-4 py-16">
      <section className="w-full max-w-2xl rounded-card border border-neutral-200 bg-white p-6 shadow-soft sm:p-10">
        <span className="grid size-12 place-items-center rounded-full bg-neutral-100 text-ink-800">
          <FileWarning aria-hidden="true" className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-ink-950">
          {copy.contentTitle}
        </h1>
        <p className="mt-2 text-neutral-600">{copy.contentDescription}</p>
        <h2 className="mt-8 text-sm font-semibold text-ink-950">{copy.contentDetails}</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {issues.map((issue, index) => (
            <li
              key={`${issue.location}-${index}`}
              className="rounded-tile bg-neutral-50 p-3 text-sm"
            >
              <code className="font-mono text-xs font-semibold text-ink-800">{issue.location}</code>
              <p className="mt-1 text-neutral-700">{issue.message}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
