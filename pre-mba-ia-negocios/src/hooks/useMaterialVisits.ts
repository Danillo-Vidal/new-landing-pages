import { useCallback, useEffect, useRef, useState } from 'react';

import type { LessonId } from '@/domain/types.ts';
import type { Clock } from '@/services/clock.ts';
import type {
  MaterialVisitsRecord,
  ProgressRepository,
} from '@/services/progress/ProgressRepository.ts';

const NO_VISITS: ReadonlySet<string> = new Set();

/**
 * Support materials the learner already opened (a click on the link, or expanding a content
 * page). Saved in the browser through the progress repository, so the check survives reloads.
 */
export function useMaterialVisits(repository: ProgressRepository, journeyId: string, clock: Clock) {
  const [record, setRecord] = useState<MaterialVisitsRecord>(() =>
    repository.loadMaterialVisits(journeyId),
  );
  const loadedRecord = useRef(record);

  useEffect(() => {
    // Skip the initial load so we never rewrite storage just by opening the page.
    if (record !== loadedRecord.current) repository.saveMaterialVisits(journeyId, record);
  }, [record, repository, journeyId]);

  const visitedIn = useCallback(
    (lessonId: LessonId): ReadonlySet<string> => {
      const visits = record[lessonId];
      return visits ? new Set(Object.keys(visits)) : NO_VISITS;
    },
    [record],
  );

  // Functional update: several clicks before the next render must all be kept.
  const markVisited = useCallback(
    (lessonId: LessonId, materialId: string) => {
      const visitedAt = clock.now().toISOString();
      setRecord((previous) =>
        previous[lessonId]?.[materialId] !== undefined
          ? previous
          : { ...previous, [lessonId]: { ...previous[lessonId], [materialId]: visitedAt } },
      );
    },
    [clock],
  );

  return { visitedIn, markVisited };
}
