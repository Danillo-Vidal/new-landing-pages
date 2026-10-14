import { uiText } from '@/content/ui-text.ts';
import { toProgressRatio } from '@/domain/video-completion.ts';

import type { EmbedCallbacks } from './player-iframe.ts';

interface Mp4EmbedProps extends EmbedCallbacks {
  readonly src: string;
  readonly poster: string | undefined;
  readonly captionsSrc: string | null;
  readonly title: string;
}

/** Native `<video>` for files hosted directly (e.g. in `public/` or a CDN). */
export function Mp4Embed({
  src,
  poster,
  captionsSrc,
  title,
  onProgress,
  onError,
  onPlay,
  onPause,
}: Mp4EmbedProps) {
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption -- captions are optional content (`captionsUrl`); the <track> below is rendered whenever it is provided.
    <video
      src={src}
      poster={poster}
      title={title}
      controls
      autoPlay
      playsInline
      preload="metadata"
      onTimeUpdate={(event) => {
        onProgress(toProgressRatio(event.currentTarget.currentTime, event.currentTarget.duration));
      }}
      onPlaying={onPlay}
      onPause={onPause}
      onWaiting={onPause}
      onEnded={() => {
        onProgress(1);
        onPause();
      }}
      onError={onError}
      className="absolute inset-0 size-full bg-ink-950"
    >
      {captionsSrc && (
        <track
          kind="captions"
          src={captionsSrc}
          srcLang="pt-BR"
          label={uiText.video.captionsLabel}
          default
        />
      )}
    </video>
  );
}
