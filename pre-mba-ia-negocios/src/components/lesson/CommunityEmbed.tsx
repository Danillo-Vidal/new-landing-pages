import { ArrowUpRight, MessagesSquare } from 'lucide-react';

import { uiText } from '@/content/ui-text.ts';
import type { Community } from '@/domain/types.ts';

/** Padlet (or any https embed) with a dashed placeholder while no URL is configured. */
export function CommunityEmbed({ community }: { readonly community: Community }) {
  const copy = uiText.community;

  if (!community.embedUrl) {
    return (
      <div className="flex flex-col items-center rounded-card border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
        <MessagesSquare aria-hidden="true" className="size-8 text-neutral-400" />
        <p className="mt-3 font-semibold text-neutral-700">{copy.placeholderTitle}</p>
        <p className="mt-1 max-w-sm text-sm text-neutral-600">{copy.placeholderDescription}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-card border border-neutral-200 bg-neutral-50">
        <iframe
          src={community.embedUrl}
          title={copy.iframeTitle(community.title)}
          loading="lazy"
          allow="camera; microphone; geolocation; display-capture; clipboard-write"
          referrerPolicy="strict-origin-when-cross-origin"
          className="block h-[32rem] w-full border-0 md:h-[38rem]"
        />
      </div>
      <a
        href={community.embedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 self-end rounded-md text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
      >
        {copy.openInNewTab}
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </a>
    </div>
  );
}
