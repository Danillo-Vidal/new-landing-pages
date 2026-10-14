import { DateOverrideBanner } from '@/components/feedback/DateOverrideBanner.tsx';
import { Hero } from '@/components/layout/Hero.tsx';
import { PageShell } from '@/components/layout/PageShell.tsx';
import type { Course } from '@/domain/types.ts';
import { useAppServices } from '@/hooks/useAppServices.ts';
import { useJourney } from '@/hooks/useJourney.ts';

import { JourneyContent } from './JourneyContent.tsx';

export function JourneyPage({ course }: { readonly course: Course }) {
  const { journey } = course;
  const { simulatedStart } = useAppServices();
  const viewModel = useJourney(course);

  return (
    <PageShell
      banner={
        simulatedStart && <DateOverrideBanner date={simulatedStart} timeZone={journey.timezone} />
      }

      hero={
        <Hero eyebrow={journey.eyebrow} title={journey.title} description={journey.description} />
      }
    >
      <JourneyContent course={course} viewModel={viewModel} />
    </PageShell>
  );
}
