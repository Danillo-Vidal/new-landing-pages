import { useReducer } from 'react';

/** `inline` = inside the panel; `expanded` = wider stage; `mini` = floating corner player. */
export type VideoDisplayMode = 'inline' | 'expanded' | 'mini';

interface VideoModeState {
  /** The facade was clicked and the real player (iframe) is mounted. */
  readonly isActivated: boolean;
  readonly mode: VideoDisplayMode;
  /** Players that show their own cover (Spalla) are mounted right away, without facade. */
  readonly startsActivated: boolean;
  /** Changes on "close" so an always-mounted player is re-created (stops playback). */
  readonly playerKey: number;
}

type VideoModeAction =
  | { readonly type: 'activate' }
  | { readonly type: 'toggleExpanded' }
  | { readonly type: 'minimize' }
  | { readonly type: 'restore' }
  | { readonly type: 'close' };

function reducer(state: VideoModeState, action: VideoModeAction): VideoModeState {
  switch (action.type) {
    case 'activate':
      return { ...state, isActivated: true };
    case 'toggleExpanded':
      return { ...state, mode: state.mode === 'expanded' ? 'inline' : 'expanded' };
    case 'minimize':
      return state.isActivated ? { ...state, mode: 'mini' } : state;
    case 'restore':
      return { ...state, mode: 'inline' };
    case 'close':
      // Unmounting the iframe is the only reliable way to stop any provider's playback.
      return {
        ...state,
        isActivated: state.startsActivated,
        mode: 'inline',
        playerKey: state.playerKey + 1,
      };
  }
}

/**
 * Display mode of the video. Switching modes only changes CSS classes on the same element,
 * so the iframe is never re-mounted and playback never restarts.
 */
export function useVideoMode(startsActivated = false) {
  const [state, dispatch] = useReducer(reducer, {
    isActivated: startsActivated,
    mode: 'inline',
    startsActivated,
    playerKey: 0,
  });
  return {
    ...state,
    activate: () => {
      dispatch({ type: 'activate' });
    },
    toggleExpanded: () => {
      dispatch({ type: 'toggleExpanded' });
    },
    minimize: () => {
      dispatch({ type: 'minimize' });
    },
    restore: () => {
      dispatch({ type: 'restore' });
    },
    close: () => {
      dispatch({ type: 'close' });
    },
  };
}
