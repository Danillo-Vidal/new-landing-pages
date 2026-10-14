import { useEffect, useEffectEvent } from 'react';

import { uiText } from '@/content/ui-text.ts';
import type { VideoSource } from '@/domain/types.ts';
import { resolveContentUrl } from '@/lib/assets.ts';

import { Mp4Embed } from './Mp4Embed.tsx';
import type { EmbedCallbacks } from './player-iframe.ts';
import { SpallaEmbed } from './SpallaEmbed.tsx';
import { VimeoEmbed } from './VimeoEmbed.tsx';
import { YouTubeEmbed } from './YouTubeEmbed.tsx';

interface VideoEmbedProps extends EmbedCallbacks {
  readonly video: VideoSource;
  readonly lessonTitle: string;
  /** Called when the player unmounts (closed or another lesson selected). */
  readonly onStopped: () => void;
}

/** Picks the real player for the provider. Mounted only after the facade is clicked. */
export function VideoEmbed({ video, lessonTitle, onStopped, ...callbacks }: VideoEmbedProps) {
  const title = uiText.video.iframeTitle(lessonTitle);
  const handleStopped = useEffectEvent(onStopped);

  useEffect(
    () => () => {
      handleStopped();
    },
    [],
  );

  switch (video.provider) {
    case 'youtube':
      return <YouTubeEmbed videoId={video.videoId} title={title} {...callbacks} />;
    case 'vimeo':
      return <VimeoEmbed reference={video} title={title} {...callbacks} />;
    case 'mp4':
      return (
        <Mp4Embed
          src={resolveContentUrl(video.url)}
          poster={video.thumbnail ? resolveContentUrl(video.thumbnail) : undefined}
          captionsSrc={video.captionsUrl ? resolveContentUrl(video.captionsUrl) : null}
          title={title}
          {...callbacks}
        />
      );
    case 'spalla':
      return <SpallaEmbed embedUrl={video.embedUrl} title={title} onPlay={callbacks.onPlay} />;
  }
}
