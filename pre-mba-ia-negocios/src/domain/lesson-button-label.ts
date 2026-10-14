import type { LessonStatus } from './types.ts';

/** Key of the lesson card action label (texts live in `content/ui-text.ts`). */
export type LessonButtonLabel = 'locked' | 'ready' | 'unlocked' | 'viewing' | 'completed';

/**
 * Card action label. A completed lesson keeps "Assistido" even when selected (the selection
 * shows on the card border).
 */
export function resolveButtonLabel(status: LessonStatus, isSelected: boolean): LessonButtonLabel {
  switch (status) {
    case 'locked':
    case 'ready':
    case 'completed':
      return status;
    case 'available':
    case 'in_progress':
      return isSelected ? 'viewing' : 'unlocked';
  }
}
