import { ArrowUpRight, Maximize2, Minimize2, PictureInPicture2, TriangleAlert } from 'lucide-react';
import type { Ref } from 'react';

import { Button } from '@/components/ui/button.tsx';
import { uiText } from '@/content/ui-text.ts';
import type { VideoSource } from '@/domain/types.ts';
import type { VideoDisplayMode } from '@/hooks/useVideoMode.ts';

import { buildVideoWatchUrl } from './video-urls.ts';

interface VideoControlsProps {
  readonly video: VideoSource;
  readonly mode: VideoDisplayMode;
  readonly isActivated: boolean;
  readonly hasPlaybackError: boolean;
  readonly onToggleExpanded: () => void;
  readonly onToggleMini: () => void;
  readonly miniToggleRef: Ref<HTMLButtonElement>;
}

/** Row under the video: direct-link fallback (left) and display mode buttons (right). */
export function VideoControls(props: VideoControlsProps) {
  const {
    video,
    mode,
    isActivated,
    hasPlaybackError,
    onToggleExpanded,
    onToggleMini,
    miniToggleRef,
  } = props;
  const copy = uiText.video;
  const isMini = mode === 'mini';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 empty:hidden">
      {hasPlaybackError && (
        <p role="alert" className="flex flex-wrap items-center gap-x-1.5 text-sm text-neutral-600">
          <TriangleAlert aria-hidden="true" className="size-4 text-ink-800" />
          {copy.errorTitle}
          <a
            href={buildVideoWatchUrl(video)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 rounded-md font-semibold text-brand-700 hover:text-brand-800 hover:underline"
          >
            {copy.watchOn[video.provider]}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </p>
      )}
      <div className="ml-auto flex items-center gap-2">
        {!isMini && (
          <Button
            size="sm"
            className="hidden md:inline-flex"
            aria-pressed={mode === 'expanded'}
            onClick={onToggleExpanded}
          >
            {mode === 'expanded' ? (
              <Minimize2 aria-hidden="true" />
            ) : (
              <Maximize2 aria-hidden="true" />
            )}
            {mode === 'expanded' ? copy.shrink : copy.expand}
          </Button>
        )}
        {isActivated && (
          <Button ref={miniToggleRef} size="sm" onClick={onToggleMini}>
            <PictureInPicture2 aria-hidden="true" />
            {isMini ? copy.restore : copy.minimize}
          </Button>
        )}
      </div>
    </div>
  );
}
