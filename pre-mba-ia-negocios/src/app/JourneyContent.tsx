import { AccessErrorState } from '@/components/feedback/AccessErrorState.tsx';
import { JourneySkeleton } from '@/components/feedback/JourneySkeleton.tsx';
import { JourneyProgress } from '@/components/journey/JourneyProgress.tsx';
import { LessonCardList } from '@/components/journey/LessonCardList.tsx';
import { SoundToggle } from '@/components/journey/SoundToggle.tsx';
import { UnlockCelebration } from '@/components/journey/UnlockCelebration.tsx';
import { LessonEmptyState } from '@/components/lesson/LessonEmptyState.tsx';
import { LessonPanel } from '@/components/lesson/LessonPanel.tsx';
import type { VideoPlaybackHandlers } from '@/components/lesson/video/player-iframe.ts';
import { uiText } from '@/content/ui-text.ts';
import type { Course, LessonId } from '@/domain/types.ts';
import { useAppServices } from '@/hooks/useAppServices.ts';
import type { JourneyViewModel } from '@/hooks/useJourney.ts';
import { useJourneyInteractions } from '@/hooks/useJourneyInteractions.ts';
import { ANCHORS } from '@/lib/anchors.ts';

interface JourneyContentProps {
  readonly course: Course;
  readonly viewModel: JourneyViewModel;
}

export function JourneyContent({ course, viewModel }: JourneyContentProps) {
  const { timezone, completionThreshold } = course.journey;
  const { allowPlaybackSimulation } = useAppServices();
  const interactions = useJourneyInteractions(course, viewModel);

  if (viewModel.status === 'loading')
    return <JourneySkeleton lessonCount={course.lessons.length} />;
  if (viewModel.status === 'error') return <AccessErrorState onRetry={viewModel.retry} />;

  const { lessonStates, progress, selectedState, announcement } = viewModel;
  const { celebration, sound, highlightedId } = interactions;
  const selectedLesson = selectedState?.lesson ?? null;
  const { playback } = viewModel;

  // Watched time is counted internally by the journey; the player only reports events.
  const playbackFor = (lessonId: LessonId): VideoPlaybackHandlers => ({
    onActivate: () => {
      playback.activate(lessonId);
    },
    onPlay: () => {
      playback.play(lessonId);
    },
    onPause: () => {
      playback.pause(lessonId);
    },
    onStopped: () => {
      playback.pause(lessonId);
    },
    onTrackingUnavailable: () => {
      playback.trackingUnavailable(lessonId);
    },
    onProgress: (ratio) => {
      viewModel.reportVideoProgress(lessonId, ratio);
    },
  });

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <section aria-labelledby={ANCHORS.journeyHeading} className="flex flex-col gap-5">
        <JourneyProgress
          states={lessonStates}
          progress={progress}
          trigger={course.progression.unlockNextOn}
          actions={<SoundToggle isEnabled={sound.isEnabled} onToggle={sound.toggle} />}
        />
        <LessonCardList
          states={lessonStates}
          selectedId={selectedLesson?.id ?? null}
          highlightedId={highlightedId}
          timeZone={timezone}
          trigger={course.progression.unlockNextOn}
          panelId={ANCHORS.lessonPanel}
          onSelect={viewModel.selectLesson}
          onUnlock={interactions.startUnlock}
          onHighlightEnd={interactions.clearHighlight}
        />
      </section>

      {selectedState && selectedLesson ? (
        <LessonPanel
          state={selectedState}
          completionThreshold={completionThreshold}
          allowManualComplete={course.features.allowManualComplete}
          onSetCompleted={viewModel.setLessonCompleted}
          playback={playbackFor(selectedLesson.id)}
          onSimulatePlay={
            allowPlaybackSimulation
              ? () => {
                  playback.activate(selectedLesson.id);
                }
              : undefined
          }
        />
      ) : (
        <LessonEmptyState nextReleaseAt={viewModel.nextReleaseAt} timeZone={timezone} />
      )}

      <p className="sr-only" aria-live="polite" role="status">
        {announcement &&
          (announcement.kind === 'unlocked'
            ? uiText.unlock.announce(announcement.order)
            : uiText.unlock.completedAnnounce(announcement.order))}
      </p>

      {celebration.celebration && (
        <UnlockCelebration
          key={celebration.celebration.lessonId}
          celebration={celebration.celebration}
          isClosing={celebration.isClosing}
          onClose={celebration.close}
        />
      )}
    </div>
  );
}
