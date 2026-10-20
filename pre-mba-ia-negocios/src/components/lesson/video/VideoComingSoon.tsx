import { Clapperboard } from 'lucide-react';

import { uiText } from '@/content/ui-text.ts';

export function VideoComingSoon() {
  return (
    <div className="video-backdrop flex aspect-video flex-col items-center justify-center gap-3 rounded-tile px-6 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-white/10 text-brand-300 ring-1 ring-white/15">
        <Clapperboard aria-hidden="true" className="size-6" />
      </span>
      <p className="text-lg font-semibold text-white">{uiText.video.comingSoonTitle}</p>
      <p className="max-w-sm text-sm text-neutral-300">{uiText.video.comingSoonDescription}</p>
    </div>
  );
}
