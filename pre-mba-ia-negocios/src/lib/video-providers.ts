/**
 * Everything that knows the URL formats of the supported video providers lives here.
 * Content editors may paste either a bare ID or a full URL; both are normalized.
 *
 * NOTE: pure module (no React, no `@/` alias, explicit `.ts` extensions) so Node tooling such
 * as vite.config can load it. See docs/ARCHITECTURE.md › "Import rules".
 */

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID_PATTERN = /^\d{6,12}$/;
const VIMEO_HASH_PATTERN = /^[A-Za-z0-9]{6,20}$/;

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
]);

function tryParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/** Accepts `dQw4w9WgXcQ`, `youtu.be/<id>`, `youtube.com/watch?v=<id>`, `/embed/<id>`, `/shorts/<id>`. */
export function extractYouTubeId(input: string): string | null {
  const value = input.trim();
  if (YOUTUBE_ID_PATTERN.test(value)) return value;

  const url = tryParseUrl(value);
  if (!url || !YOUTUBE_HOSTS.has(url.hostname)) return null;

  const fromQuery = url.searchParams.get('v');
  const segments = url.pathname.split('/').filter(Boolean);
  const fromPath =
    url.hostname === 'youtu.be'
      ? segments[0]
      : segments.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(segments[0] ?? '')
        ? segments[1]
        : undefined;

  const candidate = fromQuery ?? fromPath ?? '';
  return YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
}

export interface VimeoReference {
  readonly videoId: string;
  /** Privacy hash required by unlisted videos (`vimeo.com/<id>/<hash>`). */
  readonly privacyHash: string | null;
}

/** Accepts `123456789`, `123456789/abc123`, `vimeo.com/<id>[/<hash>]`, `player.vimeo.com/video/<id>?h=<hash>`. */
export function extractVimeoReference(input: string): VimeoReference | null {
  const value = input.trim();
  const [rawId = '', rawHash] = value.split('/');
  if (VIMEO_ID_PATTERN.test(rawId) && !value.includes(':')) {
    if (rawHash === undefined) return { videoId: rawId, privacyHash: null };
    return VIMEO_HASH_PATTERN.test(rawHash) ? { videoId: rawId, privacyHash: rawHash } : null;
  }

  const url = tryParseUrl(value);
  if (!url || !url.hostname.endsWith('vimeo.com')) return null;

  const segments = url.pathname.split('/').filter(Boolean);
  const idIndex = segments.findIndex((segment) => VIMEO_ID_PATTERN.test(segment));
  const videoId = idIndex >= 0 ? segments[idIndex] : undefined;
  if (!videoId) return null;

  const hash = url.searchParams.get('h') ?? segments[idIndex + 1] ?? null;
  return { videoId, privacyHash: hash && VIMEO_HASH_PATTERN.test(hash) ? hash : null };
}

export function buildYouTubeEmbedUrl(videoId: string, pageOrigin: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    enablejsapi: '1',
    playsinline: '1',
    rel: '0',
    origin: pageOrigin,
  });
  // youtube-nocookie: no tracking cookies until playback (LGPD-friendly).
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Ordered candidates: best quality first; the UI falls back to the next one on error. */
export function buildYouTubeThumbnailCandidates(videoId: string): string[] {
  return [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ];
}

export function buildVimeoEmbedUrl({ videoId, privacyHash }: VimeoReference): string {
  const params = new URLSearchParams({
    autoplay: '1',
    dnt: '1',
    title: '0',
    byline: '0',
    portrait: '0',
  });
  if (privacyHash) params.set('h', privacyHash);
  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
}

export function buildVimeoWatchUrl({ videoId, privacyHash }: VimeoReference): string {
  return privacyHash
    ? `https://vimeo.com/${videoId}/${privacyHash}`
    : `https://vimeo.com/${videoId}`;
}
