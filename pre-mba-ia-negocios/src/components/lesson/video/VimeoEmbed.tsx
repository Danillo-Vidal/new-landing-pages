import { useEffect, useEffectEvent, useRef } from 'react';

import { buildVimeoEmbedUrl, type VimeoReference } from '@/lib/video-providers.ts';
import { trackVimeoPlayback } from '@/services/video/vimeo-tracking.ts';

import { type EmbedCallbacks, PLAYER_IFRAME_PROPS } from './player-iframe.ts';

interface VimeoEmbedProps extends EmbedCallbacks {
  readonly reference: VimeoReference;
  readonly title: string;
}

export function VimeoEmbed({ reference, title, ...callbacks }: VimeoEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const handleProgress = useEffectEvent(callbacks.onProgress);
  const handleError = useEffectEvent(callbacks.onError);
  const handlePlay = useEffectEvent(callbacks.onPlay);
  const handlePause = useEffectEvent(callbacks.onPause);
  const handleTrackingUnavailable = useEffectEvent(callbacks.onTrackingUnavailable);
  const src = buildVimeoEmbedUrl(reference);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    return trackVimeoPlayback(iframe, {
      onProgress: (ratio) => handleProgress(ratio),
      onError: () => handleError(),
      onPlay: () => handlePlay(),
      onPause: () => handlePause(),
      onTrackingUnavailable: () => handleTrackingUnavailable(),
    });
  }, [src]);

  return <iframe ref={iframeRef} src={src} title={title} {...PLAYER_IFRAME_PROPS} />;
}
