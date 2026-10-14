import { useState } from 'react';

import { ContentErrorState } from '@/components/feedback/ContentErrorState.tsx';
import { loadCourse } from '@/content/load-course.ts';

import { AppProviders } from './AppProviders.tsx';
import { JourneyPage } from './JourneyPage.tsx';

export function App() {
  const [courseResult] = useState(loadCourse);

  if (!courseResult.ok) return <ContentErrorState issues={courseResult.issues} />;

  return (
    <AppProviders journey={courseResult.course.journey}>
      <JourneyPage course={courseResult.course} />
    </AppProviders>
  );
}
