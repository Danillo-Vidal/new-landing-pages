import rawCourse from '../content/course.json';
import type { AccessContext, Lesson, ReleaseRule } from '../domain/types.ts';
import { parseZonedDateTime } from '../lib/timezone.ts';

export const SAO_PAULO = 'America/Sao_Paulo';

/** Instant from a course.json-style string (date-only = 00:00 in São Paulo). */
export function at(value: string, timeZone = SAO_PAULO): Date {
  const date = parseZonedDateTime(value, timeZone);
  if (date === null) throw new Error(`Invalid test date: ${value}`);
  return date;
}

export function createContext(overrides: Partial<AccessContext> = {}): AccessContext {
  return { userId: null, enrollmentDate: null, now: at('2026-10-14'), ...overrides };
}

export function createLesson(overrides: Partial<Lesson> & { release?: ReleaseRule } = {}): Lesson {
  return {
    id: 'aula-1',
    order: 1,
    title: 'Aula de teste',
    subtitle: '',
    description: '',
    release: { type: 'fixed_date', date: at('2026-10-13') },
    video: null,
    videoDurationMs: null,
    materials: [],
    community: { title: 'Comunidade', description: '', embedUrl: null },
    ...overrides,
  };
}

/** Deep copy of the real course.json, safe to mutate inside a test. */
export function cloneRawCourse(): typeof rawCourse {
  return structuredClone(rawCourse);
}
