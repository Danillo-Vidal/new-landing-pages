import { useEffect, useEffectEvent, useRef } from 'react';

import { buildYouTubeEmbedUrl } from '@/lib/video-providers.ts';
import { trackYouTubePlayback } from '@/services/video/youtube-tracking.ts';

import { type EmbedCallbacks, PLAYER_IFRAME_PROPS } from './player-iframe.ts';

interface YouTubeEmbedProps extends EmbedCallbacks {
  readonly videoId: string;
  readonly title: string;
}

export function YouTubeEmbed({ videoId, title, ...callbacks }: YouTubeEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const handleProgress = useEffectEvent(callbacks.onProgress);
  const handleError = useEffectEvent(callbacks.onError);
  const handlePlay = useEffectEvent(callbacks.onPlay);
  const handlePause = useEffectEvent(callbacks.onPause);
  const handleTrackingUnavailable = useEffectEvent(callbacks.onTrackingUnavailable);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    return trackYouTubePlayback(iframe, {
      onProgress: (ratio) => handleProgress(ratio),
      onError: () => handleError(),
      onPlay: () => handlePlay(),
      onPause: () => handlePause(),
      onTrackingUnavailable: () => handleTrackingUnavailable(),
    });
  }, [videoId]);

  return (
    <iframe
      ref={iframeRef}
      src={buildYouTubeEmbedUrl(videoId, window.location.origin)}
      title={title}
      {...PLAYER_IFRAME_PROPS}
    />
  );
}
