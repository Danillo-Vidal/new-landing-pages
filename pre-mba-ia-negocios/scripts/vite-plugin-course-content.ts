import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { Plugin } from 'vite';

import { type ContentIssue, parseCourse } from '../src/content/course.schema.ts';

const COURSE_FILE = 'src/content/course.json';
const PAGES_DIR = 'src/content/pages';

interface LoadedPages {
  readonly pages: Record<string, unknown>;
  readonly files: string[];
  readonly issues: ContentIssue[];
}

/** Reads `src/content/pages/*.json` (rich content of expandable materials). */
async function loadPages(pagesDir: string): Promise<LoadedPages> {
  const names = await readdir(pagesDir).catch(() => [] as string[]);
  const loaded: LoadedPages = { pages: {}, files: [], issues: [] };
  for (const name of names.filter((file) => file.endsWith('.json'))) {
    const filePath = path.join(pagesDir, name);
    loaded.files.push(filePath);
    try {
      loaded.pages[name.replace(/\.json$/, '')] = JSON.parse(await readFile(filePath, 'utf8'));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      loaded.issues.push({
        location: `pages/${name}`,
        message: `O arquivo não é um JSON válido (${reason}).`,
      });
    }
  }
  return loaded;
}

type CourseCheck =
  { ok: true; title: string; description: string } | { ok: false; issues: readonly ContentIssue[] };

async function checkCourseFile(filePath: string, pagesDir: string): Promise<CourseCheck> {
  const { pages, issues: pageIssues } = await loadPages(pagesDir);
  if (pageIssues.length > 0) return { ok: false, issues: pageIssues };

  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      issues: [{ location: COURSE_FILE, message: `O arquivo não é um JSON válido (${reason}).` }],
    };
  }

  const result = parseCourse(raw, pages);
  if (!result.ok) return { ok: false, issues: result.issues };
  return {
    ok: true,
    title: result.course.journey.title,
    description: result.course.journey.description,
  };
}

function formatReport(issues: readonly ContentIssue[]): string {
  const lines = issues.map((issue) => `  • ${issue.location} — ${issue.message}`);
  return [`\n[course.json] Conteúdo inválido (${issues.length} problema(s)):`, ...lines, ''].join(
    '\n',
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Validates `src/content/course.json` with the same Zod schema used at runtime.
 * - `vite build`: an invalid file FAILS the build (nothing broken reaches production).
 * - `vite dev`: only warns, so the page can render the friendly error screen.
 * It also injects the journey title/description into the HTML <head> (SEO and LMS tab title).
 */
export function courseContentPlugin(): Plugin {
  let courseFilePath = COURSE_FILE;
  let pagesDir = PAGES_DIR;
  let isBuild = false;

  return {
    name: 'xp:course-content',
    configResolved(config) {
      courseFilePath = path.join(config.root, COURSE_FILE);
      pagesDir = path.join(config.root, PAGES_DIR);
      isBuild = config.command === 'build';
    },
    async buildStart() {
      this.addWatchFile(courseFilePath);
      for (const file of (await loadPages(pagesDir)).files) this.addWatchFile(file);
      const check = await checkCourseFile(courseFilePath, pagesDir);
      if (check.ok) return;
      const report = formatReport(check.issues);
      if (isBuild) this.error(report);
      else this.warn(report);
    },
    async transformIndexHtml(html) {
      const check = await checkCourseFile(courseFilePath, pagesDir);
      const title = check.ok ? check.title : 'Jornada de aprendizagem';
      const description = check.ok ? check.description : '';
      return html
        .replaceAll('%COURSE_TITLE%', escapeHtml(title))
        .replaceAll('%COURSE_DESCRIPTION%', escapeHtml(description));
    },
  };
}
