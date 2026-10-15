import { FolderOpen, MessagesSquare, MonitorPlay } from 'lucide-react';

import { uiText } from '@/content/ui-text.ts';
import type { LessonId, LessonState } from '@/domain/types.ts';
import { useCollapse } from '@/hooks/useCollapse.ts';
import { ANCHORS } from '@/lib/anchors.ts';

import { CollapsibleSection } from './CollapsibleSection.tsx';
import { CommunityEmbed } from './CommunityEmbed.tsx';
import { LessonCompletion } from './LessonCompletion.tsx';
import { LessonPanelHeader } from './LessonPanelHeader.tsx';
import { MaterialsList } from './MaterialsList.tsx';
import type { VideoPlaybackHandlers } from './video/player-iframe.ts';
import { VideoPlayer } from './VideoPlayer.tsx';

const SECTIONS = ['video', 'materials', 'community'] as const;
const TITLE_ID = `${ANCHORS.lessonPanel}-titulo`;

interface LessonPanelProps {
  readonly state: LessonState;
  readonly completionThreshold: number;
  readonly allowManualComplete: boolean;
  readonly onSetCompleted: (lessonId: LessonId, completed: boolean) => void;
  /** Watched-time hooks of THIS lesson's video (internal, nothing is displayed). */
  readonly playback: VideoPlaybackHandlers;
  readonly onSimulatePlay?: (() => void) | undefined;
  /** Support materials already opened in this lesson (green check). */
  readonly visitedMaterialIds: ReadonlySet<string>;
  readonly onMaterialVisit: (lessonId: LessonId, materialId: string) => void;
}

export function LessonPanel({
  state,
  completionThreshold,
  allowManualComplete,
  onSetCompleted,
  playback,
  onSimulatePlay,
  visitedMaterialIds,
  onMaterialVisit,
}: LessonPanelProps) {
  const { lesson } = state;
  const isCompleted = state.status === 'completed';
  const collapse = useCollapse(SECTIONS);
  const copy = uiText.lessonPanel;

  return (
    <article
      id={ANCHORS.lessonPanel}
      aria-labelledby={TITLE_ID}
      className="rounded-card border border-neutral-200 bg-white p-5 shadow-soft sm:p-8 md:p-10"
    >
      <LessonPanelHeader
        lesson={lesson}
        titleId={TITLE_ID}
        isCompleted={isCompleted}
        areAllSectionsOpen={collapse.areAllOpen}
        onToggleAllSections={collapse.toggleAll}
      />

      <div className="mt-8 divide-y divide-neutral-200">
        <CollapsibleSection
          section="video"
          collapse={collapse}
          title={copy.sections.video}
          icon={MonitorPlay}
        >
          <div className="flex flex-col gap-4">
            <VideoPlayer
              key={lesson.id}
              video={lesson.video}
              lessonTitle={lesson.title}
              lessonOrder={lesson.order}
              playback={playback}
              onSimulatePlay={onSimulatePlay}
            />
            <LessonCompletion
              isCompleted={isCompleted}
              completionThreshold={completionThreshold}
              allowManualComplete={allowManualComplete}
              onChange={(completed) => onSetCompleted(lesson.id, completed)}
            />
          </div>
        </CollapsibleSection>

        {lesson.description && (
          <div className="py-6">
            <p className="max-w-3xl text-base leading-relaxed text-pretty text-neutral-700">
              {lesson.description}
            </p>
          </div>
        )}

        <CollapsibleSection
          section="materials"
          collapse={collapse}
          title={copy.sections.materials}
          icon={FolderOpen}
        >
          <MaterialsList
            key={lesson.id}
            materials={lesson.materials}
            visitedIds={visitedMaterialIds}
            onVisit={(materialId) => onMaterialVisit(lesson.id, materialId)}
          />
        </CollapsibleSection>

        <CollapsibleSection
          section="community"
          collapse={collapse}
          title={lesson.community.title}
          description={lesson.community.description}
          icon={MessagesSquare}
        >
          <CommunityEmbed community={lesson.community} />
        </CollapsibleSection>
      </div>
    </article>
  );
}
