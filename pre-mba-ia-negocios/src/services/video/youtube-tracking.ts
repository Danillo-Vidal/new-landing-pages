import { toProgressRatio } from '@/domain/video-completion.ts';

import type { PlaybackCallbacks, StopTracking } from './playback-tracking.ts';

const YOUTUBE_IFRAME_API_URL = 'https://www.youtube.com/iframe_api';
const POLL_INTERVAL_MS = 1000;

/** Minimal typing of the YouTube IFrame API surface we use. */
interface YouTubePlayer {
  getCurrentTime(): number;
  getDuration(): number;
}

interface YouTubePlayerEvent {
  readonly data: number;
}

interface YouTubeNamespace {
  Player: new (
    element: HTMLIFrameElement,
    options: {
      events: {
        onStateChange?: (event: YouTubePlayerEvent) => void;
        onError?: (event: YouTubePlayerEvent) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: {
    readonly ENDED: number;
    readonly PLAYING: number;
    readonly PAUSED: number;
    readonly BUFFERING: number;
  };
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YouTubeNamespace> | null = null;

/** Loads the IFrame API script once per page; retries on the next call if it failed. */
function loadYouTubeIframeApi(): Promise<YouTubeNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  apiPromise ??= new Promise<YouTubeNamespace>((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = YOUTUBE_IFRAME_API_URL;
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error('YouTube IFrame API could not be loaded'));
    };
    document.head.append(script);
  });
  return apiPromise;
}

/**
 * Attaches the YouTube IFrame API to an existing iframe (created with `enablejsapi=1`) and
 * polls the watched fraction while playing. If the API is blocked, playback still works and
 * the manual "Marcar como assistida" button remains the fallback.
 */
export function trackYouTubePlayback(
  iframe: HTMLIFrameElement,
  callbacks: PlaybackCallbacks,
): StopTracking {
  let stopped = false;
  let intervalId: number | undefined;

  const stopPolling = () => {
    window.clearInterval(intervalId);
    intervalId = undefined;
  };

  loadYouTubeIframeApi()
    .then((YT) => {
      if (stopped) return;
      const player = new YT.Player(iframe, {
        events: {
          onStateChange: ({ data }) => {
            stopPolling();
            if (data === YT.PlayerState.ENDED) callbacks.onProgress(1);
            if (data === YT.PlayerState.PLAYING) callbacks.onPlay();
            else if (
              data === YT.PlayerState.PAUSED ||
              data === YT.PlayerState.BUFFERING ||
              data === YT.PlayerState.ENDED
            ) {
              callbacks.onPause();
            }
            if (data !== YT.PlayerState.PLAYING) return;
            intervalId = window.setInterval(() => {
              callbacks.onProgress(toProgressRatio(player.getCurrentTime(), player.getDuration()));
            }, POLL_INTERVAL_MS);
          },
          onError: () => {
            callbacks.onError();
          },
        },
      });
    })
    .catch(() => {
      // Progress tracking unavailable (blocked by network/privacy tools). Not fatal: the
      // watched time falls back to the elapsed time since play.
      if (!stopped) callbacks.onTrackingUnavailable();
    });

  return () => {
    stopped = true;
    stopPolling();
  };
}
