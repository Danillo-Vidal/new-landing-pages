import { useEffect, useRef } from 'react';

import { AccessErrorState } from '@/components/feedback/AccessErrorState.tsx';
import { JourneySkeleton } from '@/components/feedback/JourneySkeleton.tsx';
import { JourneyCarousel } from '@/components/journey/JourneyCarousel.tsx';
import { JourneyProgress } from '@/components/journey/JourneyProgress.tsx';
import { LessonCardList } from '@/components/journey/LessonCardList.tsx';
import { RewardCard } from '@/components/journey/RewardCard.tsx';
import { UnlockCelebration } from '@/components/journey/UnlockCelebration.tsx';
import { LessonEmptyState } from '@/components/lesson/LessonEmptyState.tsx';
import { LessonPanel } from '@/components/lesson/LessonPanel.tsx';
import type { VideoPlaybackHandlers } from '@/components/lesson/video/player-iframe.ts';
import { uiText } from '@/content/ui-text.ts';
import type { Course, LessonId } from '@/domain/types.ts';
import { useAppServices } from '@/hooks/useAppServices.ts';
import { useCarousel, useIsDesktop } from '@/hooks/useCarousel.ts';
import type { JourneyViewModel } from '@/hooks/useJourney.ts';
import { useJourneyInteractions } from '@/hooks/useJourneyInteractions.ts';
import { useMaterialVisits } from '@/hooks/useMaterialVisits.ts';
import { useReward } from '@/hooks/useReward.ts';
import { ANCHORS } from '@/lib/anchors.ts';

interface JourneyContentProps {
  readonly course: Course;
  readonly viewModel: JourneyViewModel;
}

export function JourneyContent({ course, viewModel }: JourneyContentProps) {
  const { timezone, completionThreshold } = course.journey;
  const { allowPlaybackSimulation, progressRepository, clock } = useAppServices();
  const interactions = useJourneyInteractions(course, viewModel);
  const materialVisits = useMaterialVisits(progressRepository, course.journey.id, clock);

  // 6th card (reward) + carousel. The reward is derived from the lesson statuses.
  const listRef = useRef<HTMLOListElement>(null);
  const statuses = viewModel.status === 'ready' ? viewModel.lessonStates.map((s) => s.status) : [];
  const reward = useReward(statuses, course.reward, interactions.isPreparingReveal);
  const isDesktop = useIsDesktop();
  // Only once the cards exist: the carousel listeners attach when this turns true.
  const isCarouselActive = viewModel.status === 'ready' && (!isDesktop || reward.isVisible);
  const carousel = useCarousel(
    listRef,
    isCarouselActive,
    course.lessons.length + (reward.isVisible ? 1 : 0),
  );
  const { revealLast } = carousel;
  useEffect(() => {
    if (reward.isRevealing) revealLast();
  }, [reward.isRevealing, revealLast]);

  if (viewModel.status === 'loading')
    return <JourneySkeleton lessonCount={course.lessons.length} />;
  if (viewModel.status === 'error') return <AccessErrorState onRetry={viewModel.retry} />;

  const { lessonStates, progress, selectedState, announcement } = viewModel;
  const { celebration, highlightedId } = interactions;
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
          teaser={course.reward.enabled ? course.reward.teaser : null}
          bonus={
            reward.isVisible && course.reward.progress
              ? {
                  ...course.reward.progress,
                  isAwaitingReveal: reward.isAwaitingReveal,
                  isRevealing: reward.isRevealing,
                }
              : null
          }
        />
        <JourneyCarousel
          isActive={isCarouselActive}
          isDesktop={isDesktop}
          nav={carousel.nav}
          position={carousel.position}
          trackId={ANCHORS.lessonList}
          onStep={carousel.step}
        >
          <LessonCardList
            listRef={listRef}
            listId={ANCHORS.lessonList}
            isDesktopCarousel={isDesktop && reward.isVisible}
            trailing={
              reward.isVisible && (
                <RewardCard
                  reward={course.reward}
                  isAwaitingReveal={reward.isAwaitingReveal}
                  isRevealing={reward.isRevealing}
                  onRevealEnd={reward.endReveal}
                />
              )
            }
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
        </JourneyCarousel>
      </section>

      {selectedState && selectedLesson ? (
        <LessonPanel
          state={selectedState}
          completionThreshold={completionThreshold}
          allowManualComplete={course.features.allowManualComplete}
          onSetCompleted={viewModel.setLessonCompleted}
          visitedMaterialIds={materialVisits.visitedIn(selectedLesson.id)}
          onMaterialVisit={materialVisits.markVisited}
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
      <p className="sr-only" aria-live="polite">
        {reward.wasRevealed ? course.reward.announce : ''}
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
