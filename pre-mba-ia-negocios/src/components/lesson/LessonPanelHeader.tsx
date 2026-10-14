import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { uiText } from '@/content/ui-text.ts';
import type { Lesson } from '@/domain/types.ts';

interface LessonPanelHeaderProps {
  readonly lesson: Lesson;
  readonly titleId: string;
  readonly isCompleted: boolean;
  readonly areAllSectionsOpen: boolean;
  readonly onToggleAllSections: () => void;
}

export function LessonPanelHeader({
  lesson,
  titleId,
  isCompleted,
  areAllSectionsOpen,
  onToggleAllSections,
}: LessonPanelHeaderProps) {
  const copy = uiText.lessonPanel;

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <Badge size="sm">{copy.tag(lesson.order, isCompleted)}</Badge>
        <h2
          id={titleId}
          className="mt-4 text-2xl leading-tight font-bold tracking-[-0.025em] text-balance text-ink-950 md:text-[2rem]"
        >
          {lesson.title}
        </h2>
        {lesson.subtitle && (
          <p className="mt-2 text-base text-pretty text-neutral-600">{lesson.subtitle}</p>
        )}
      </div>
      <Button variant="ghost" size="sm" className="self-start" onClick={onToggleAllSections}>
        {areAllSectionsOpen ? (
          <ChevronsDownUp aria-hidden="true" />
        ) : (
          <ChevronsUpDown aria-hidden="true" />
        )}
        {areAllSectionsOpen ? copy.collapseAll : copy.expandAll}
      </Button>
    </header>
  );
}
