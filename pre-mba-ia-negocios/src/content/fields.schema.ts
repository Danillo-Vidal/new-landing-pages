/**
 * Field validators shared by `course.json` and the content pages (`pages/*.json`).
 *
 * NOTE: pure module (no React, no `@/` alias, explicit `.ts` extensions) so Node tooling such
 * as vite.config can load it. See docs/ARCHITECTURE.md › "Import rules".
 */
import { z } from 'zod';

import type { VideoSource } from '../domain/types.ts';
import { parseDuration } from '../lib/duration.ts';
import { extractVimeoReference, extractYouTubeId } from '../lib/video-providers.ts';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RELATIVE_ASSET_PATTERN = /^\/?(?!.*\.\.)[A-Za-z0-9_\-./]+$/;

// ---------------------------------------------------------------------------------------------
// Reusable field validators
// ---------------------------------------------------------------------------------------------

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isSpallaEmbedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'spalla.io' || url.hostname.endsWith('.spalla.io'))
    );
  } catch {
    return false;
  }
}

export const slug = z.string().trim().regex(SLUG_PATTERN, {
  error: 'Use apenas letras minúsculas, números e hífens (ex.: "aula-1").',
});

export const requiredText = z.string().trim().min(1, { error: 'Este campo não pode ficar vazio.' });

export const optionalText = z.string().trim().default('');

/** "" → null ("Em breve"); https URL or a file inside `public/` → kept. */
export const optionalLink = z
  .string()
  .trim()
  .refine((value) => value === '' || isHttpsUrl(value) || RELATIVE_ASSET_PATTERN.test(value), {
    error:
      'Link inválido. Use um endereço completo começando com "https://", um arquivo da pasta public/ ' +
      '(ex.: "materiais/aula-1.pdf") ou deixe vazio para exibir "Em breve".',
  })
  .transform((value) => (value === '' ? null : value));

/** "" → null; only https is accepted because the page runs inside an https LMS iframe. */
export const optionalEmbedUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || isHttpsUrl(value), {
    error: 'Link de incorporação inválido. Use o endereço "https://..." do embed ou deixe vazio.',
  })
  .transform((value) => (value === '' ? null : value));

export const optionalSpallaEmbedUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || isSpallaEmbedUrl(value), {
    error: 'Link da Spalla inválido. Use o endereço "https://...spalla.io" do player.',
  })
  .transform((value) => (value === '' ? null : value));

/** "" → null (unknown length); otherwise "mm:ss" or "h:mm:ss" → milliseconds. */
export const optionalDuration = z
  .string()
  .trim()
  .refine((value) => value === '' || parseDuration(value) !== null, {
    error: 'Duração inválida. Use "mm:ss" ou "h:mm:ss" (ex.: "12:30" ou "1:04:20").',
  })
  .transform((value) => (value === '' ? null : parseDuration(value)))
  .default(null);

export const thumbnail = optionalLink.default(null);

export const rawVideoSchema = z.discriminatedUnion(
  'provider',
  [
    z.strictObject({
      provider: z.literal('youtube'),
      videoId: z
        .string()
        .trim()
        .refine((value) => value === '' || extractYouTubeId(value) !== null, {
          error:
            'Vídeo do YouTube inválido. Cole o ID (11 caracteres) ou o link completo do vídeo.',
        }),
      thumbnail,
      duration: optionalDuration,
    }),
    z.strictObject({
      provider: z.literal('vimeo'),
      videoId: z
        .string()
        .trim()
        .refine((value) => value === '' || extractVimeoReference(value) !== null, {
          error: 'Vídeo do Vimeo inválido. Cole o ID numérico ou o link completo do vídeo.',
        }),
      thumbnail,
      duration: optionalDuration,
    }),
    z.strictObject({
      provider: z.literal('mp4'),
      url: optionalLink,
      thumbnail,
      captionsUrl: optionalLink.default(null),
      duration: optionalDuration,
    }),
    z.strictObject({
      provider: z.literal('spalla'),
      embedUrl: optionalSpallaEmbedUrl,
      duration: optionalDuration,
    }),
  ],
  { error: 'Provedor de vídeo inválido. Use "youtube", "vimeo", "mp4" ou "spalla".' },
);

/** Empty IDs/links become `null` ("Vídeo em breve"); the duration is kept either way. */
export function toVideoSource(video: z.output<typeof rawVideoSchema>): VideoSource | null {
  switch (video.provider) {
    case 'youtube': {
      const videoId = extractYouTubeId(video.videoId);
      return videoId ? { provider: 'youtube', videoId, thumbnail: video.thumbnail } : null;
    }
    case 'vimeo': {
      const reference = extractVimeoReference(video.videoId);
      return reference ? { provider: 'vimeo', ...reference, thumbnail: video.thumbnail } : null;
    }
    case 'mp4':
      return video.url
        ? {
            provider: 'mp4',
            url: video.url,
            thumbnail: video.thumbnail,
            captionsUrl: video.captionsUrl,
          }
        : null;
    case 'spalla':
      return video.embedUrl ? { provider: 'spalla', embedUrl: video.embedUrl } : null;
  }
}

export const videoSchema = rawVideoSchema.transform((video) => ({
  source: toVideoSource(video),
  durationMs: video.duration,
}));
