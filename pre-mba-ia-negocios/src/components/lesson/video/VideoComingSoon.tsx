import { Clapperboard, Play } from 'lucide-react';

import { Button } from '@/components/ui/button.tsx';
import { uiText } from '@/content/ui-text.ts';

interface VideoComingSoonProps {
  /** When set (test environments), shows a button that simulates watching the video. */
  readonly onSimulatePlay?: (() => void) | undefined;
}

export function VideoComingSoon({ onSimulatePlay }: VideoComingSoonProps) {
  return (
    <div className="video-backdrop flex aspect-video flex-col items-center justify-center gap-3 rounded-tile px-6 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-white/10 text-brand-300 ring-1 ring-white/15">
        <Clapperboard aria-hidden="true" className="size-6" />
      </span>
      <p className="text-lg font-semibold text-white">{uiText.video.comingSoonTitle}</p>
      <p className="max-w-sm text-sm text-neutral-300">{uiText.video.comingSoonDescription}</p>
      {onSimulatePlay && (
        <Button variant="primary" size="sm" onClick={onSimulatePlay}>
          <Play aria-hidden="true" />
          {uiText.video.simulatePlay}
        </Button>
      )}
    </div>
  );
}
