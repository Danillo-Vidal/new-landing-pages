import { useEffect, useEffectEvent, useRef } from 'react';

import { PLAYER_IFRAME_PROPS } from './player-iframe.ts';

interface SpallaEmbedProps {
  readonly embedUrl: string;
  readonly title: string;
  /** First interaction with the player (Spalla has no JS API to report playback). */
  readonly onPlay: () => void;
}

export function SpallaEmbed({ embedUrl, title, onPlay }: SpallaEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const handlePlay = useEffectEvent(onPlay);

  // A click inside a cross-origin iframe moves the focus into it: the page receives `blur` and
  // the iframe becomes the active element. That is the only "play" signal available.
  useEffect(() => {
    const handleBlur = () => {
      window.setTimeout(() => {
        if (document.activeElement === iframeRef.current) handlePlay();
      }, 0);
    };
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={embedUrl}
      title={title}
      {...PLAYER_IFRAME_PROPS}
      allow="accelerometer; xr-spatial-tracking; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
    />
  );
}
