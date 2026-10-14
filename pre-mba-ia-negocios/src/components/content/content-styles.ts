import type { ContentBlock, ContentButton, ContentPageTone } from '@/domain/types.ts';

/**
 * THE place to restyle the expandable content pages (e.g. "Guia de Abertura").
 * Only Tailwind classes built from the design tokens (src/styles/tokens.css) are available.
 */

/** Page background/border per `"tone"` in pages/<id>.json. */
export const PAGE_TONE_CLASS: Record<ContentPageTone, string> = {
  brand: 'border-brand-100 bg-brand-50/60',
  neutral: 'border-neutral-200 bg-neutral-50',
  plain: 'border-neutral-200 bg-white',
};

export const PAGE_CLASS = {
  container: 'rounded-card border p-5 sm:p-7',
  intro: 'text-[15px] leading-relaxed text-pretty text-neutral-600',
  blocks: 'flex flex-col gap-2',
  /** Extra space before a heading, so sections breathe (first block has none). */
  sectionGap: 'mt-4 first:mt-0',
} as const;

export const HEADING_CLASS: Record<Extract<ContentBlock, { type: 'heading' }>['level'], string> = {
  2: 'text-[15px] font-semibold tracking-[-0.01em] text-ink-950',
  3: 'text-xs font-semibold tracking-[0.08em] text-neutral-600 uppercase',
};

export const TEXT_CLASS = {
  paragraph: 'text-[15px] leading-relaxed text-pretty text-neutral-600',
  bold: 'font-semibold text-ink-950',
  link: 'font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2 hover:text-brand-800',
} as const;

export const LIST_CLASS = {
  list: 'flex flex-col gap-1.5 text-[15px] leading-relaxed text-neutral-600',
  bullet: 'ml-5 list-disc marker:text-brand-600',
  number: 'ml-5 list-decimal marker:font-semibold marker:text-brand-700',
  check: 'flex flex-col gap-1.5',
  checkIcon: 'mt-1 size-4 shrink-0 text-brand-600',
} as const;

export const CALLOUT_CLASS: Record<Extract<ContentBlock, { type: 'callout' }>['tone'], string> = {
  info: 'border-neutral-200 bg-white text-neutral-700',
  tip: 'border-brand-200 bg-white text-neutral-700',
  warning: 'border-neutral-300 bg-neutral-100 text-ink-800',
};

export const CALLOUT_ICON_CLASS: Record<
  Extract<ContentBlock, { type: 'callout' }>['tone'],
  string
> = {
  info: 'text-neutral-500',
  tip: 'text-brand-600',
  warning: 'text-ink-800',
};

export const MEDIA_CLASS = {
  figure: 'my-2 flex flex-col gap-2',
  image: 'w-full rounded-tile border border-neutral-200 bg-white object-cover',
  imageSize: { full: 'w-full', medium: 'w-full max-w-xl' },
  caption: 'text-xs text-neutral-500',
  video: 'relative aspect-video overflow-hidden rounded-tile bg-ink-950 shadow-soft',
} as const;

export const BUTTON_CLASS: Record<ContentButton['style'], string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800',
  secondary:
    'border border-neutral-200 bg-white text-ink-950 hover:border-brand-600 hover:text-brand-700',
};

export const BUTTONS_ROW_CLASS = 'my-1 flex flex-wrap gap-2';
export const BUTTON_BASE_CLASS =
  'inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ease-out';

export const DIVIDER_CLASS = 'my-3 border-neutral-200';
