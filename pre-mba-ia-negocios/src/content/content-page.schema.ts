/**
 * Validation of the content pages (`src/content/pages/<id>.json`): rich content that opens
 * inside the lesson when a material is expanded (e.g. "Guia de Abertura").
 *
 * NOTE: pure module (no React, no `@/` alias, explicit `.ts` extensions) so Node tooling such
 * as vite.config can load it. See docs/ARCHITECTURE.md › "Import rules".
 */
import { z } from 'zod';

import type { ContentPage } from '../domain/types.ts';
import { findUnsafeInlineLinks } from '../lib/inline-text.ts';
import { MATERIAL_ICON_KEYS } from '../lib/material-icons.ts';
import {
  isHttpsUrl,
  rawVideoSchema,
  RELATIVE_ASSET_PATTERN,
  requiredText,
  toVideoSource,
} from './fields.schema.ts';

const MAX_BLOCKS = 80;
const MAX_BUTTONS = 6;

/** Text with optional `**negrito**` and `[texto](link)`; links must be https or public files. */
const richText = requiredText.refine((value) => findUnsafeInlineLinks(value).length === 0, {
  error:
    'Link inválido no texto. Use [texto](https://...) ou um arquivo da pasta public/ ' +
    '(ex.: [Guia](materiais/guia.pdf)).',
});

/** Required link: https URL or a file inside `public/` (e.g. "materiais/aula-1/guia.pdf"). */
const contentLink = z
  .string()
  .trim()
  .refine((value) => isHttpsUrl(value) || RELATIVE_ASSET_PATTERN.test(value), {
    error:
      'Link inválido. Use um endereço "https://..." ou um arquivo da pasta public/ ' +
      '(ex.: "materiais/aula-1/guia.pdf").',
  });

const buttonSchema = z.strictObject({
  label: requiredText,
  url: contentLink,
  icon: z
    .enum(MATERIAL_ICON_KEYS, {
      error: `Ícone inválido. Use um destes: ${MATERIAL_ICON_KEYS.join(', ')}.`,
    })
    .default('link'),
  style: z
    .enum(['primary', 'secondary'], { error: 'Estilo inválido. Use "primary" ou "secondary".' })
    .default('secondary'),
  download: z.boolean().default(false),
});

const blockSchema = z.discriminatedUnion(
  'type',
  [
    z.strictObject({
      type: z.literal('heading'),
      text: requiredText,
      level: z
        .union([z.literal(2), z.literal(3)], { error: 'Use 2 (título) ou 3 (subtítulo).' })
        .default(2),
    }),
    z.strictObject({ type: z.literal('text'), text: richText }),
    z.strictObject({
      type: z.literal('list'),
      style: z
        .enum(['bullet', 'number', 'check'], {
          error: 'Estilo de lista inválido. Use "bullet", "number" ou "check".',
        })
        .default('bullet'),
      items: z.array(richText).min(1, { error: 'A lista precisa de pelo menos um item.' }),
    }),
    z.strictObject({
      type: z.literal('image'),
      src: contentLink,
      alt: z
        .string()
        .trim()
        .min(1, { error: 'Descreva a imagem em "alt" (texto lido por leitores de tela).' }),
      caption: z
        .string()
        .trim()
        .default('')
        .transform((value) => (value === '' ? null : value)),
      size: z
        .enum(['full', 'medium'], { error: 'Tamanho inválido. Use "full" ou "medium".' })
        .default('full'),
    }),
    z.strictObject({
      type: z.literal('video'),
      title: requiredText,
      video: rawVideoSchema.transform((raw, ctx) => {
        const video = toVideoSource(raw);
        if (video === null) {
          ctx.addIssue({ code: 'custom', message: 'Informe o vídeo (ID ou link).', input: raw });
          return z.NEVER;
        }
        return video;
      }),
    }),
    z.strictObject({
      type: z.literal('buttons'),
      items: z
        .array(buttonSchema)
        .min(1, { error: 'Adicione pelo menos um botão.' })
        .max(MAX_BUTTONS, { error: `Use no máximo ${MAX_BUTTONS} botões por grupo.` }),
    }),
    z.strictObject({
      type: z.literal('callout'),
      tone: z
        .enum(['info', 'tip', 'warning'], {
          error: 'Tom inválido. Use "info", "tip" ou "warning".',
        })
        .default('info'),
      title: z
        .string()
        .trim()
        .default('')
        .transform((value) => (value === '' ? null : value)),
      text: richText,
    }),
    z.strictObject({ type: z.literal('divider') }),
  ],
  {
    error:
      'Tipo de bloco inválido. Use "heading", "text", "list", "image", "video", "buttons", ' +
      '"callout" ou "divider".',
  },
);

const rawContentPageSchema = z.strictObject({
  intro: z.string().trim().default(''),
  tone: z
    .enum(['brand', 'neutral', 'plain'], {
      error: 'Tom inválido. Use "brand", "neutral" ou "plain".',
    })
    .default('brand'),
  blocks: z
    .array(blockSchema)
    .min(1, { error: 'A página precisa de pelo menos um bloco.' })
    .max(MAX_BLOCKS, { error: `Use no máximo ${MAX_BLOCKS} blocos por página.` }),
});

export function contentPageSchema(id: string) {
  return rawContentPageSchema.transform(({ intro, tone, blocks }): ContentPage => ({
    id,
    intro: intro === '' ? null : intro,
    tone,
    blocks,
  }));
}
