import type { IframeHTMLAttributes } from 'react';

/** Attributes shared by every embedded player (permissions, privacy, layout). */
export const PLAYER_IFRAME_PROPS = {
  allow:
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen',
  allowFullScreen: true,
  loading: 'lazy',
  referrerPolicy: 'strict-origin-when-cross-origin',
  className: 'absolute inset-0 size-full border-0',
} as const satisfies IframeHTMLAttributes<HTMLIFrameElement>;

export interface EmbedCallbacks {
  readonly onProgress: (ratio: number) => void;
  readonly onError: () => void;
  readonly onPlay: () => void;
  readonly onPause: () => void;
  readonly onTrackingUnavailable: () => void;
}

/** Watched-time hooks for the lesson video (the counting itself is internal, never shown). */
export interface VideoPlaybackHandlers extends Omit<EmbedCallbacks, 'onError'> {
  /** Facade clicked: the real player is about to be mounted. */
  readonly onActivate: () => void;
  /** The player was unmounted (closed, or another lesson was selected). */
  readonly onStopped: () => void;
}
