import { uiText } from '@/content/ui-text.ts';

import { Skeleton } from '../ui/skeleton.tsx';

/** Placeholder with the same geometry as the real page (no layout shift). */
export function JourneySkeleton({ lessonCount }: { readonly lessonCount: number }) {
  return (
    <div role="status" className="flex flex-col gap-8 md:gap-10">
      <span className="sr-only">{uiText.page.loading}</span>
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-64 max-w-full" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="hidden h-8 w-56 rounded-full sm:block" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <div className="flex gap-3 overflow-hidden lg:grid lg:grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))]">
        {Array.from({ length: lessonCount }, (_, index) => (
          <Skeleton
            key={index}
            className="h-48 w-[72%] max-w-[17rem] shrink-0 rounded-card sm:w-[42%] md:w-[30%] lg:w-auto lg:max-w-none"
          />
        ))}
      </div>
      <div className="flex flex-col gap-5 rounded-card border border-neutral-200 bg-white p-5 sm:p-8 md:p-10">
        <Skeleton className="h-6 w-48 rounded-full" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="aspect-video w-full rounded-tile" />
      </div>
    </div>
  );
}
