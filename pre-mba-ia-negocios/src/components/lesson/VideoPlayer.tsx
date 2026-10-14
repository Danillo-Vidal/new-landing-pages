import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';

import { uiText } from '@/content/ui-text.ts';
import type { VideoSource } from '@/domain/types.ts';
import { useVideoMode } from '@/hooks/useVideoMode.ts';
import { cn } from '@/lib/cn.ts';

import { MiniPlayerBar } from './video/MiniPlayerBar.tsx';
import type { VideoPlaybackHandlers } from './video/player-iframe.ts';
import { VideoComingSoon } from './video/VideoComingSoon.tsx';
import { VideoControls } from './video/VideoControls.tsx';
import { VideoEmbed } from './video/VideoEmbed.tsx';
import { VideoFacade } from './video/VideoFacade.tsx';

interface VideoPlayerProps {
  readonly video: VideoSource | null;
  readonly lessonTitle: string;
  readonly lessonOrder: number;
  readonly playback: VideoPlaybackHandlers;
  /** Lesson without a configured video: simulates a play so the journey can be tested. */
  readonly onSimulatePlay?: () => void;
}

export function VideoPlayer({ video, onSimulatePlay, ...props }: VideoPlayerProps) {
  return video ? (
    <PlayableVideo video={video} {...props} />
  ) : (
    <VideoComingSoon onSimulatePlay={onSimulatePlay} />
  );
}

type FocusTarget = 'facade' | 'miniToggle';
type ResizeEdge = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

interface MiniPlayerBounds {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

interface MiniPlayerInteraction {
  readonly kind: 'move' | 'resize';
  readonly edge?: ResizeEdge;
  readonly startX: number;
  readonly startY: number;
  readonly initialBounds: MiniPlayerBounds;
}

const MINI_PLAYER_GUTTER = 8;
const MINI_PLAYER_MIN_WIDTH = 240;
const MINI_PLAYER_MIN_HEIGHT = 140;

/**
 * IMPORTANT: inline / expanded / mini only toggle CSS classes on the SAME elements. The
 * iframe keeps its position in the React tree, so it is never re-mounted and the video
 * never restarts. Conditional siblings are rendered before it on purpose.
 */
function PlayableVideo({
  video,
  lessonTitle,
  lessonOrder,
  playback,
}: Omit<VideoPlayerProps, 'onSimulatePlay'> & { readonly video: VideoSource }) {
  // Spalla shows its own cover image: its player is mounted directly, without our facade.
  const player = useVideoMode(video.provider === 'spalla');
  const { onActivate, ...embedHandlers } = playback;
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const facadeRef = useRef<HTMLButtonElement>(null);
  const miniToggleRef = useRef<HTMLButtonElement>(null);
  const miniPlayerRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<FocusTarget | null>(null);
  const miniInteraction = useRef<MiniPlayerInteraction | null>(null);
  const [miniBounds, setMiniBounds] = useState<MiniPlayerBounds | null>(null);
  const isMini = player.mode === 'mini';

  useEffect(() => {
    if (!isMini || miniBounds || !miniPlayerRef.current) return;
    const { left, top, width, height } = miniPlayerRef.current.getBoundingClientRect();
    setMiniBounds({ left, top, width, height });
  }, [isMini, miniBounds]);

  useEffect(() => {
    if (!isMini) return;
    const keepMiniPlayerInViewport = () => {
      setMiniBounds((bounds) => {
        if (!bounds) return bounds;
        const maxWidth = Math.max(1, window.innerWidth - MINI_PLAYER_GUTTER * 2);
        const maxHeight = Math.max(1, window.innerHeight - MINI_PLAYER_GUTTER * 2);
        const width = Math.min(bounds.width, maxWidth);
        const height = Math.min(bounds.height, maxHeight);
        return {
          left: Math.min(
            Math.max(MINI_PLAYER_GUTTER, bounds.left),
            window.innerWidth - width - MINI_PLAYER_GUTTER,
          ),
          top: Math.min(
            Math.max(MINI_PLAYER_GUTTER, bounds.top),
            window.innerHeight - height - MINI_PLAYER_GUTTER,
          ),
          width,
          height,
        };
      });
    };
    window.addEventListener('resize', keepMiniPlayerInViewport);
    return () => window.removeEventListener('resize', keepMiniPlayerInViewport);
  }, [isMini]);

  // Buttons that trigger a mode change may disappear: move focus somewhere sensible.
  useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    (target === 'facade' ? facadeRef : miniToggleRef).current?.focus();
  });

  const restoreFromMini = () => {
    pendingFocus.current = 'miniToggle';
    player.restore();
  };
  const close = () => {
    pendingFocus.current = 'facade';
    setHasPlaybackError(false);
    player.close();
  };

  const startMiniInteraction = (
    event: ReactPointerEvent<HTMLElement>,
    kind: MiniPlayerInteraction['kind'],
    edge?: ResizeEdge,
  ) => {
    if (!miniPlayerRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = miniPlayerRef.current.getBoundingClientRect();
    miniInteraction.current = {
      kind,
      edge,
      startX: event.clientX,
      startY: event.clientY,
      initialBounds: miniBounds ?? {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
    };
  };

  const moveMiniInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    const interaction = miniInteraction.current;
    if (!interaction) return;
    const { initialBounds, kind, edge } = interaction;
    const deltaX = event.clientX - interaction.startX;
    const deltaY = event.clientY - interaction.startY;
    const maxWidth = Math.max(1, window.innerWidth - MINI_PLAYER_GUTTER * 2);
    const maxHeight = Math.max(1, window.innerHeight - MINI_PLAYER_GUTTER * 2);

    if (kind === 'move') {
      setMiniBounds({
        ...initialBounds,
        left: Math.min(
          Math.max(MINI_PLAYER_GUTTER, initialBounds.left + deltaX),
          window.innerWidth - initialBounds.width - MINI_PLAYER_GUTTER,
        ),
        top: Math.min(
          Math.max(MINI_PLAYER_GUTTER, initialBounds.top + deltaY),
          window.innerHeight - initialBounds.height - MINI_PLAYER_GUTTER,
        ),
      });
      return;
    }

    const resizeFromLeft = edge?.includes('w') ?? false;
    const resizeFromTop = edge?.includes('n') ?? false;
    const changesWidth = edge?.includes('e') || resizeFromLeft;
    const changesHeight = edge?.includes('s') || resizeFromTop;
    const minWidth = Math.min(MINI_PLAYER_MIN_WIDTH, maxWidth);
    const minHeight = Math.min(MINI_PLAYER_MIN_HEIGHT, maxHeight);
    const width = changesWidth
      ? Math.max(
          minWidth,
          Math.min(maxWidth, initialBounds.width + (resizeFromLeft ? -deltaX : deltaX)),
        )
      : initialBounds.width;
    const height = changesHeight
      ? Math.max(
          minHeight,
          Math.min(maxHeight, initialBounds.height + (resizeFromTop ? -deltaY : deltaY)),
        )
      : initialBounds.height;
    const left = resizeFromLeft
      ? initialBounds.left + initialBounds.width - width
      : initialBounds.left;
    const top = resizeFromTop
      ? initialBounds.top + initialBounds.height - height
      : initialBounds.top;

    setMiniBounds({
      left: Math.min(
        Math.max(MINI_PLAYER_GUTTER, left),
        window.innerWidth - width - MINI_PLAYER_GUTTER,
      ),
      top: Math.min(
        Math.max(MINI_PLAYER_GUTTER, top),
        window.innerHeight - height - MINI_PLAYER_GUTTER,
      ),
      width,
      height,
    });
  };

  const endMiniInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    miniInteraction.current = null;
  };

  const miniPlayerStyle =
    isMini && miniBounds
      ? {
          left: `${miniBounds.left}px`,
          top: `${miniBounds.top}px`,
          right: 'auto',
          bottom: 'auto',
          width: `${miniBounds.width}px`,
          height: `${miniBounds.height}px`,
        }
      : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className={cn(player.mode === 'expanded' && 'video-stage-expanded')}>
        {isMini && (
          <p className="flex h-14 items-center rounded-tile border border-dashed border-neutral-300 bg-neutral-50 px-4 text-sm text-neutral-600">
            {uiText.video.miniPlayerPlaceholder}
          </p>
        )}
        <div
          ref={miniPlayerRef}
          role={isMini ? 'region' : undefined}
          aria-label={isMini ? uiText.video.miniPlayerRegion(lessonTitle) : undefined}
          style={miniPlayerStyle}
          className={cn(
            'overflow-hidden rounded-tile bg-ink-950 shadow-soft',
            isMini && 'video-frame-mini animate-fade-up shadow-float',
          )}
        >
          {isMini && (
            <>
              <MiniPlayerBar
                lessonTitle={lessonTitle}
                onRestore={restoreFromMini}
                onClose={close}
                onDragStart={(event) => startMiniInteraction(event, 'move')}
                onDrag={moveMiniInteraction}
                onDragEnd={endMiniInteraction}
              />
              {(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const).map((edge) => (
                <button
                  key={edge}
                  type="button"
                  aria-label={uiText.video.resizeMiniPlayer(edge)}
                  className={`mini-resize-handle mini-resize-${edge}`}
                  onPointerDown={(event) => startMiniInteraction(event, 'resize', edge)}
                  onPointerMove={moveMiniInteraction}
                  onPointerUp={endMiniInteraction}
                  onPointerCancel={endMiniInteraction}
                />
              ))}
            </>
          )}
          <div className={cn('relative aspect-video', isMini && 'video-mini-content')}>
            {player.isActivated ? (
              <VideoEmbed
                key={player.playerKey}
                video={video}
                lessonTitle={lessonTitle}
                {...embedHandlers}
                onError={() => {
                  setHasPlaybackError(true);
                }}
              />
            ) : (
              <VideoFacade
                ref={facadeRef}
                video={video}
                lessonTitle={lessonTitle}
                lessonOrder={lessonOrder}
                onPlay={() => {
                  onActivate();
                  player.activate();
                }}
              />
            )}
          </div>
        </div>
      </div>
      <VideoControls
        video={video}
        mode={player.mode}
        isActivated={player.isActivated}
        hasPlaybackError={hasPlaybackError}
        onToggleExpanded={player.toggleExpanded}
        onToggleMini={isMini ? player.restore : player.minimize}
        miniToggleRef={miniToggleRef}
      />
    </div>
  );
}
