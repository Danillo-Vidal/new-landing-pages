import { Play } from 'lucide-react';
import { type Ref, useEffect, useRef, useState } from 'react';

import { uiText } from '@/content/ui-text.ts';
import type { VideoSource } from '@/domain/types.ts';

import { getThumbnailCandidates } from './video-urls.ts';

/** YouTube answers missing `maxresdefault` with a 120px placeholder instead of an error. */
const MIN_THUMBNAIL_WIDTH = 121;

interface VideoFacadeProps {
  readonly video: VideoSource;
  readonly lessonTitle: string;
  readonly lessonOrder: number;
  readonly onPlay: () => void;
  readonly ref?: Ref<HTMLButtonElement>;
}

/**
 * Lightweight placeholder (thumbnail + play button). The heavy player iframe is only
 * created after the click, which keeps the first load fast inside the LMS.
 */
export function VideoFacade({ video, lessonTitle, lessonOrder, onPlay, ref }: VideoFacadeProps) {
  const [candidates] = useState(() => getThumbnailCandidates(video));
  const [candidateIndex, setCandidateIndex] = useState(0);
  const thumbnail = candidates[candidateIndex];
  const imageRef = useRef<HTMLImageElement>(null);

  const tryNextCandidate = () => {
    setCandidateIndex((index) => index + 1);
  };

  // An image may finish loading before React attaches `onLoad` (cache): check it once mounted.
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0 && image.naturalWidth < MIN_THUMBNAIL_WIDTH) {
      setCandidateIndex((index) => index + 1);
    }
  }, [candidateIndex]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onPlay}
      aria-label={uiText.video.play(lessonTitle)}
      className="group video-backdrop absolute inset-0 size-full overflow-hidden text-left"
    >
      {thumbnail && (
        <img
          ref={imageRef}
          key={thumbnail}
          src={thumbnail}
          alt=""
          loading="lazy"
          decoding="async"
          onError={tryNextCandidate}
          onLoad={(event) => {
            if (event.currentTarget.naturalWidth < MIN_THUMBNAIL_WIDTH) tryNextCandidate();
          }}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
      )}
      <span className="absolute inset-0 bg-linear-to-t from-ink-950/70 via-ink-950/10 to-transparent" />
      <span className="absolute top-1/2 left-1/2 grid size-16 -translate-1/2 place-items-center rounded-full bg-brand-600 text-white shadow-float ring-8 ring-white/15 transition-transform duration-200 ease-out group-hover:scale-105 md:size-20">
        <Play aria-hidden="true" className="ml-1 size-7 fill-current md:size-8" />
      </span>
      <span className="absolute bottom-4 left-4 rounded-md bg-white px-2.5 py-1 text-[11px] font-bold tracking-wide text-brand-700 uppercase">
        {uiText.video.releasedBadge(lessonOrder)}
      </span>
    </button>
  );
}
