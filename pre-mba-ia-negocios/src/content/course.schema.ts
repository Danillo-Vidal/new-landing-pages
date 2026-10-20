/**
 * Validation + normalization of `course.json`.
 *
 * - Used at BUILD time (scripts/vite-plugin-course-content.ts): invalid content fails the build.
 * - Used at RUNTIME (load-course.ts): invalid content renders a friendly error screen.
 *
 * Output is the domain model (`Course`): empty strings become `null`, dates become `Date`,
 * video URLs become IDs and lessons are sorted by `order`.
 *
 * NOTE: pure module (no React, no `@/` alias, explicit `.ts` extensions) so Node tooling such
 * as vite.config can load it. See docs/ARCHITECTURE.md › "Import rules".
 */
import { z } from 'zod';

import type { Course, Lesson, Material, ReleaseRule } from '../domain/types.ts';
import { MATERIAL_ICON_KEYS } from '../lib/material-icons.ts';
import { isValidTimeZone, parseZonedDateTime } from '../lib/timezone.ts';
import { contentPageSchema } from './content-page.schema.ts';
import {
  optionalEmbedUrl,
  optionalLink,
  optionalText,
  requiredText,
  slug,
  videoSchema,
} from './fields.schema.ts';

const MAX_MATERIALS_PER_LESSON = 8;

const INVALID_DATE_MESSAGE =
  'Data inválida. Use "AAAA-MM-DD" (meia-noite no fuso da jornada) ou ' +
  '"AAAA-MM-DDTHH:MM:SS-03:00" (com o fuso explícito).';

const releaseDate = z
  .string()
  .trim()
  .refine((value) => parseZonedDateTime(value, 'UTC') !== null, { error: INVALID_DATE_MESSAGE });

// ---------------------------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------------------------

const releaseSchema = z.discriminatedUnion(
  'type',
  [
    z.strictObject({ type: z.literal('fixed_date'), date: releaseDate }),
    z.strictObject({
      type: z.literal('enrollment_offset'),
      days: z
        .number()
        .int({ error: 'Use um número inteiro de dias (ex.: 10).' })
        .min(0, { error: 'O número de dias não pode ser negativo.' })
        .max(3650, { error: 'Use no máximo 3650 dias.' }),
    }),
    z.strictObject({ type: z.literal('sequential') }),
    z.strictObject({ type: z.literal('locked') }),
  ],
  {
    error:
      'Tipo de liberação inválido. Use "sequential", "locked", "fixed_date" ou "enrollment_offset".',
  },
);

/** Content pages loaded from `src/content/pages/*.json`, keyed by file name (without .json). */
export type RawContentPages = Readonly<Record<string, unknown>>;

/**
 * A material is a link (`url`), an expandable content page (`page`) or "Em breve" (neither).
 * Page errors are reported on the material, naming the page file and field.
 */
function createMaterialSchema(pages: RawContentPages) {
  return z
    .strictObject({
      id: slug,
      label: requiredText,
      icon: z.enum(MATERIAL_ICON_KEYS, {
        error: `Ícone inválido. Use um destes: ${MATERIAL_ICON_KEYS.join(', ')}.`,
      }),
      url: optionalLink.default(null),
      page: slug.optional(),
    })
    .transform(({ page: pageId, ...material }, ctx): Material => {
      if (pageId === undefined) return { ...material, page: null };
      if (material.url !== null) {
        ctx.addIssue({
          code: 'custom',
          path: ['page'],
          message: 'Use "url" (link) OU "page" (conteúdo na página), não os dois.',
          input: pageId,
        });
        return z.NEVER;
      }
      if (!(pageId in pages)) {
        ctx.addIssue({
          code: 'custom',
          path: ['page'],
          message: `Página não encontrada. Crie o arquivo src/content/pages/${pageId}.json.`,
          input: pageId,
        });
        return z.NEVER;
      }
      const result = contentPageSchema(pageId).safeParse(pages[pageId], { error: errorMap });
      if (result.success) return { ...material, page: result.data };
      for (const issue of result.error.issues) {
        const field = joinPath(issue.path);
        ctx.addIssue({
          code: 'custom',
          path: ['page'],
          message: `pages/${pageId}.json${field ? ` › ${field}` : ''} — ${issue.message}`,
          input: pageId,
        });
      }
      return z.NEVER;
    });
}

const communitySchema = z.strictObject({
  title: requiredText,
  description: optionalText,
  embedUrl: optionalEmbedUrl.default(null),
});

function createLessonSchema(pages: RawContentPages) {
  return z.strictObject({
    id: slug,
    order: z
      .number()
      .int({ error: 'A ordem deve ser um número inteiro (1, 2, 3...).' })
      .min(1, { error: 'A ordem começa em 1.' }),
    title: requiredText,
    subtitle: optionalText,
    description: optionalText,
    release: releaseSchema.default({ type: 'sequential' }),
    video: videoSchema.default({ source: null, durationMs: null }),
    materials: z
      .array(createMaterialSchema(pages))
      .max(MAX_MATERIALS_PER_LESSON, {
        error: `Cada aula pode ter no máximo ${MAX_MATERIALS_PER_LESSON} materiais.`,
      })
      .default([]),
    community: communitySchema,
  });
}

const headerSchema = z.strictObject({
  brandName: requiredText,
  logoUrl: optionalLink.default(null),
  label: optionalText,
});

const journeySchema = z.strictObject({
  id: slug,
  eyebrow: optionalText,
  title: requiredText,
  description: optionalText,
  timezone: z.string().trim().refine(isValidTimeZone, {
    error: 'Fuso horário inválido. Use um nome IANA, ex.: "America/Sao_Paulo".',
  }),
  completionThreshold: z
    .number()
    .gt(0, { error: 'Use um número maior que 0 (ex.: 0.9 = 90%).' })
    .max(1, { error: 'Use um número de 0 a 1 (ex.: 0.9 = 90%).' }),
  header: headerSchema.optional(),
});

// Course-wide settings (all optional, with the defaults below).

const progressionSchema = z
  .strictObject({
    unlockNextOn: z.enum(['play', 'watched'], {
      error: 'Gatilho inválido. Use "play" (ao dar play) ou "watched" (ao concluir a aula).',
    }),
  })
  .default({ unlockNextOn: 'play' });

const featuresSchema = z
  .strictObject({ allowManualComplete: z.boolean() })
  .default({ allowManualComplete: false });

const soundSchema = z
  .strictObject({
    enabledByDefault: z.boolean(),
    volume: z
      .number()
      .min(0, { error: 'Use um volume de 0 a 1 (ex.: 0.12).' })
      .max(1, { error: 'Use um volume de 0 a 1 (ex.: 0.12).' }),
  })
  .default({ enabledByDefault: true, volume: 0.12 });

const animationSchema = z
  .strictObject({
    unlockOverlayMs: z
      .number()
      .int({ error: 'Use um número inteiro de milissegundos (ex.: 2200).' })
      .min(1600, { error: 'Use pelo menos 1600 ms.' })
      .max(10000, { error: 'Use no máximo 10000 ms.' }),
  })
  .default({ unlockOverlayMs: 2200 });

/** "" or an http(s) link. Other protocols (e.g. "javascript:") are rejected on purpose. */
const rewardUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || /^https?:\/\/\S+$/i.test(value), {
    error: 'URL inválida, use https://... (ou deixe vazio para "Link em breve").',
  })
  .transform((value) => (value === '' ? null : value));

const rewardSchema = z
  .strictObject({
    enabled: z.boolean(),
    unlockWhen: z.enum(['all_unlocked', 'all_watched'], {
      error:
        'Regra inválida. Use "all_unlocked" (todas liberadas) ou "all_watched" (todas assistidas).',
    }),
    icon: z.enum(['gift'], { error: 'Ícone inválido. Use "gift".' }).default('gift'),
    title: requiredText,
    description: requiredText,
    cta: z.strictObject({ label: requiredText, url: rewardUrl, pendingLabel: requiredText }),
    announce: requiredText,
    overlayNote: requiredText,
    teaser: optionalText.transform((value) => (value === '' ? null : value)),
    progress: z
      .strictObject({ label: optionalText, valueText: requiredText })
      .optional()
      .transform((value) => value ?? null),
  })
  .superRefine((reward, ctx) => {
    if (reward.enabled && reward.progress === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['progress'],
        message: 'Obrigatório com "enabled": true. Informe "label" e "valueText" do bônus.',
      });
    }
  });

// ---------------------------------------------------------------------------------------------
// Whole file
// ---------------------------------------------------------------------------------------------

function findDuplicates(values: readonly (string | number)[]): Set<string | number> {
  const seen = new Set<string | number>();
  const duplicates = new Set<string | number>();
  for (const value of values) (seen.has(value) ? duplicates : seen).add(value);
  return duplicates;
}

type RawLesson = z.output<ReturnType<typeof createLessonSchema>>;

function toLesson({ video, ...lesson }: RawLesson, release: ReleaseRule): Lesson {
  return { ...lesson, release, video: video.source, videoDurationMs: video.durationMs };
}

/** Course schema for a given set of content pages (`pages/*.json`). */
export function createCourseSchema(pages: RawContentPages = {}) {
  const rawCourseSchema = z
    .strictObject({
      journey: journeySchema,
      progression: progressionSchema,
      features: featuresSchema,
      sound: soundSchema,
      animation: animationSchema,
      reward: rewardSchema,
      lessons: z
        .array(createLessonSchema(pages))
        .min(1, { error: 'Cadastre pelo menos uma aula.' }),
    })
    .superRefine(({ lessons }, ctx) => {
      const duplicatedIds = findDuplicates(lessons.map((lesson) => lesson.id));
      const duplicatedOrders = findDuplicates(lessons.map((lesson) => lesson.order));

      lessons.forEach((lesson, index) => {
        if (duplicatedIds.has(lesson.id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['lessons', index, 'id'],
            message: `O id "${lesson.id}" está repetido; cada aula precisa de um id único.`,
          });
        }
        if (duplicatedOrders.has(lesson.order)) {
          ctx.addIssue({
            code: 'custom',
            path: ['lessons', index, 'order'],
            message: `A ordem ${lesson.order} está repetida; cada aula precisa de uma ordem única.`,
          });
        }
        const duplicatedMaterials = findDuplicates(lesson.materials.map((material) => material.id));
        lesson.materials.forEach((material, materialIndex) => {
          if (duplicatedMaterials.has(material.id)) {
            ctx.addIssue({
              code: 'custom',
              path: ['lessons', index, 'materials', materialIndex, 'id'],
              message: `O id de material "${material.id}" está repetido nesta aula.`,
            });
          }
        });
      });
    });

  return rawCourseSchema.transform((raw, ctx): Course => {
    const timeZone = raw.journey.timezone;
    const lessons: Lesson[] = [];

    raw.lessons.forEach((lesson, index) => {
      if (lesson.release.type !== 'fixed_date') {
        lessons.push(toLesson(lesson, lesson.release));
        return;
      }
      // The format was validated per field; the conversion depends on the journey time zone.
      const date = parseZonedDateTime(lesson.release.date, timeZone);
      if (date === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['lessons', index, 'release', 'date'],
          message: INVALID_DATE_MESSAGE,
          input: lesson.release.date,
        });
        return;
      }
      lessons.push(toLesson(lesson, { type: 'fixed_date', date }));
    });

    if (lessons.length !== raw.lessons.length) return z.NEVER;

    const { journey, progression, features, sound, animation } = raw;
    return {
      journey: { ...journey, header: journey.header ?? null },
      progression,
      features,
      sound,
      animation,
      reward: raw.reward, // `icon` is ignored: only one icon today (lucide Gift)
      lessons: lessons.sort((a, b) => a.order - b.order),
    };
  });
}

// ---------------------------------------------------------------------------------------------
// Friendly error reporting
// ---------------------------------------------------------------------------------------------

export interface ContentIssue {
  /** Human readable path, e.g. `lessons[2] (aula-3) › release.date`. */
  readonly location: string;
  readonly message: string;
}

export type CourseParseResult =
  | { readonly ok: true; readonly course: Course }
  | { readonly ok: false; readonly issues: readonly ContentIssue[] };

const portugueseFallback = z.locales.ptBR().localeError;

const errorMap: z.core.$ZodErrorMap = (issue) => {
  if (issue.code === 'invalid_type' && issue.input === undefined) {
    return 'Campo obrigatório ausente.';
  }
  if (issue.code === 'unrecognized_keys') {
    return `Campo desconhecido: ${issue.keys.map((key) => `"${key}"`).join(', ')}. Verifique a grafia.`;
  }
  return portugueseFallback(issue);
};

function joinPath(path: readonly PropertyKey[]): string {
  return path.reduce<string>((acc, key) => {
    if (typeof key === 'number') return `${acc}[${key}]`;
    return acc === '' ? String(key) : `${acc}.${String(key)}`;
  }, '');
}

function readLessonId(raw: unknown, index: number): string | null {
  if (typeof raw !== 'object' || raw === null || !('lessons' in raw)) return null;
  const { lessons } = raw;
  if (!Array.isArray(lessons)) return null;
  const lesson: unknown = lessons[index];
  if (typeof lesson !== 'object' || lesson === null || !('id' in lesson)) return null;
  return typeof lesson.id === 'string' ? lesson.id : null;
}

function describeLocation(path: readonly PropertyKey[], raw: unknown): string {
  if (path.length === 0) return 'course.json';
  const [head, index, ...rest] = path;
  if (head !== 'lessons' || typeof index !== 'number') return joinPath(path);

  const lessonId = readLessonId(raw, index);
  const lessonLabel = `lessons[${index}]${lessonId ? ` (${lessonId})` : ''}`;
  return rest.length > 0 ? `${lessonLabel} › ${joinPath(rest)}` : lessonLabel;
}

export function parseCourse(raw: unknown, pages: RawContentPages = {}): CourseParseResult {
  const result = createCourseSchema(pages).safeParse(raw, { error: errorMap });
  if (result.success) return { ok: true, course: result.data };

  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      location: describeLocation(issue.path, raw),
      message: issue.message,
    })),
  };
}
