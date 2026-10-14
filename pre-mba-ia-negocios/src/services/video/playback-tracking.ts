/** Callbacks a player integration reports to. `ratio` is the watched fraction (0-1). */
export interface PlaybackCallbacks {
  onProgress(ratio: number): void;
  onError(): void;
  /** The player started (or resumed) playing. */
  onPlay(): void;
  /** The player paused, buffered or ended: stop counting watched time. */
  onPause(): void;
  /** The provider SDK could not be loaded: play/pause events will never arrive. */
  onTrackingUnavailable(): void;
}

/** Stops listening to the player. Must NOT remove or reload the iframe. */
export type StopTracking = () => void;
