import rawCourse from './course.json';
import { type CourseParseResult, parseCourse, type RawContentPages } from './course.schema.ts';

/** Every `pages/<id>.json` is bundled; a material uses one with `"page": "<id>"`. */
const PAGE_FILES = import.meta.glob<unknown>('./pages/*.json', { eager: true, import: 'default' });

export function loadContentPages(): RawContentPages {
  return Object.fromEntries(
    Object.entries(PAGE_FILES).map(([path, page]) => [
      path.replace(/^\.\/pages\//, '').replace(/\.json$/, ''),
      page,
    ]),
  );
}

/**
 * The course is bundled with the app (static hosting), so it is parsed once at startup.
 * The build already rejects invalid content; this runtime check protects local development
 * and any future content source (e.g. a CMS) with the same friendly error screen.
 */
export function loadCourse(): CourseParseResult {
  return parseCourse(rawCourse, loadContentPages());
}
