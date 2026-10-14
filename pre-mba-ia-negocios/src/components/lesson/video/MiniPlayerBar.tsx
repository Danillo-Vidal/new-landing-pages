import { Maximize2, X } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import { Button } from '@/components/ui/button.tsx';
import { uiText } from '@/content/ui-text.ts';

interface MiniPlayerBarProps {
  readonly lessonTitle: string;
  readonly onRestore: () => void;
  readonly onClose: () => void;
  readonly onDragStart: (event: ReactPointerEvent<HTMLElement>) => void;
  readonly onDrag: (event: ReactPointerEvent<HTMLElement>) => void;
  readonly onDragEnd: (event: ReactPointerEvent<HTMLElement>) => void;
}

export function MiniPlayerBar({
  lessonTitle,
  onRestore,
  onClose,
  onDragStart,
  onDrag,
  onDragEnd,
}: MiniPlayerBarProps) {
  return (
    <div className="flex items-center gap-1 bg-ink-950 py-1.5 pr-1.5 pl-3 text-white">
      <p
        className="mini-player-drag-handle min-w-0 flex-1 truncate text-xs font-semibold"
        onPointerDown={onDragStart}
        onPointerMove={onDrag}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        {lessonTitle}
      </p>
      <Button
        variant="inverse"
        size="icon"
        aria-label={uiText.video.restore}
        title={uiText.video.restore}
        onClick={onRestore}
      >
        <Maximize2 aria-hidden="true" />
      </Button>
      <Button
        variant="inverse"
        size="icon"
        aria-label={uiText.video.close}
        title={uiText.video.close}
        onClick={onClose}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
