import type { PlaybackCallbacks, StopTracking } from './playback-tracking.ts';

/**
 * Attaches the official Vimeo Player SDK to an existing iframe. The SDK is loaded on demand
 * (separate chunk), so journeys that only use YouTube never download it.
 */
export function trackVimeoPlayback(
  iframe: HTMLIFrameElement,
  callbacks: PlaybackCallbacks,
): StopTracking {
  let stopTracking: StopTracking | null = null;
  let stopped = false;

  import('@vimeo/player')
    .then(({ default: VimeoPlayer }) => {
      if (stopped) return;
      const player = new VimeoPlayer(iframe);
      const handleTimeUpdate = ({ percent }: { percent: number }) => {
        callbacks.onProgress(percent);
      };
      const handleEnded = () => {
        callbacks.onProgress(1);
        callbacks.onPause();
      };
      const handlePlay = () => {
        callbacks.onPlay();
      };
      const handlePause = () => {
        callbacks.onPause();
      };
      const handleError = () => {
        callbacks.onError();
      };
      player.on('timeupdate', handleTimeUpdate);
      player.on('play', handlePlay);
      player.on('pause', handlePause);
      player.on('ended', handleEnded);
      player.on('error', handleError);
      stopTracking = () => {
        player.off('timeupdate', handleTimeUpdate);
        player.off('play', handlePlay);
        player.off('pause', handlePause);
        player.off('ended', handleEnded);
        player.off('error', handleError);
      };
    })
    .catch(() => {
      // SDK unavailable: playback still works; the watched time falls back to elapsed time.
      if (!stopped) callbacks.onTrackingUnavailable();
    });

  return () => {
    stopped = true;
    stopTracking?.();
  };
}
