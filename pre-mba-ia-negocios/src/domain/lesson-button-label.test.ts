import { describe, expect, it } from 'vitest';

import { resolveButtonLabel } from './lesson-button-label.ts';
import type { LessonStatus } from './types.ts';

describe('resolveButtonLabel', () => {
  it.each<[LessonStatus, string, string]>([
    ['locked', 'locked', 'locked'],
    ['ready', 'ready', 'ready'],
    ['available', 'unlocked', 'viewing'],
    ['in_progress', 'unlocked', 'viewing'],
    ['completed', 'completed', 'completed'],
  ])('%s → %s (not selected) / %s (selected)', (status, idle, selected) => {
    expect(resolveButtonLabel(status, false)).toBe(idle);
    expect(resolveButtonLabel(status, true)).toBe(selected);
  });
});
