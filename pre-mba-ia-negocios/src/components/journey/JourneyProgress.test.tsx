// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SAO_PAULO } from '@/test/fixtures.ts';

import { JourneyProgress } from './JourneyProgress.tsx';

afterEach(cleanup);

function renderProgress(
  releaseMode: 'learner' | 'enrollment' | 'dates',
  enrollmentDate: Date | null,
) {
  render(
    <JourneyProgress
      states={[]}
      progress={{ released: 1, total: 5, completed: 0, releasedPct: 20, completedPct: 0 }}
      trigger="play"
      releaseMode={releaseMode}
      enrollmentDate={enrollmentDate}
      timeZone={SAO_PAULO}
      teaser={null}
      bonus={null}
    />,
  );
}

describe('<JourneyProgress />', () => {
  it('shows the enrollment day in the journey time zone', () => {
    // 01:30 UTC on Oct 22 is still Oct 21 in São Paulo.
    renderProgress('enrollment', new Date('2026-10-22T01:30:00.000Z'));
    expect(screen.getByText('Inscrição em 21 de out. de 2026')).toBeTruthy();
  });

  it('hides it without a date or when lessons do not depend on enrollment', () => {
    renderProgress('enrollment', null);
    expect(screen.queryByText(/Inscrição em/)).toBeNull();
    cleanup();
    renderProgress('dates', new Date('2026-10-21T12:00:00.000Z'));
    expect(screen.queryByText(/Inscrição em/)).toBeNull();
  });
});
