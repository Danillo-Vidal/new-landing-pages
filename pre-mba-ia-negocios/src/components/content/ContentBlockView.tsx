import { CircleAlert, CircleCheck, Info, Lightbulb } from 'lucide-react';

import { uiText } from '@/content/ui-text.ts';
import type { ContentBlock, ContentButton } from '@/domain/types.ts';
import { resolveContentUrl } from '@/lib/assets.ts';
import { cn } from '@/lib/cn.ts';
import { MATERIAL_ICONS } from '@/lib/material-icons.ts';

import {
  BUTTON_BASE_CLASS,
  BUTTON_CLASS,
  BUTTONS_ROW_CLASS,
  CALLOUT_CLASS,
  CALLOUT_ICON_CLASS,
  DIVIDER_CLASS,
  HEADING_CLASS,
  LIST_CLASS,
  MEDIA_CLASS,
  PAGE_CLASS,
  TEXT_CLASS,
} from './content-styles.ts';
import { ContentVideo } from './ContentVideo.tsx';
import { InlineText } from './InlineText.tsx';

const CALLOUT_ICON = { info: Info, tip: Lightbulb, warning: CircleAlert } as const;

function ContentButtonLink({ button }: { readonly button: ContentButton }) {
  const Icon = MATERIAL_ICONS[button.icon];
  return (
    <a
      href={resolveContentUrl(button.url)}
      {...(button.download ? { download: '' } : { target: '_blank', rel: 'noopener noreferrer' })}
      className={cn(BUTTON_BASE_CLASS, BUTTON_CLASS[button.style])}
    >
      <Icon aria-hidden="true" className="size-4" />
      {button.label}
      {!button.download && <span className="sr-only">{uiText.materials.opensInNewTab}</span>}
    </a>
  );
}

/** One block of a content page. Styles live in content-styles.ts. */
export function ContentBlockView({ block }: { readonly block: ContentBlock }) {
  switch (block.type) {
    case 'heading': {
      const Heading = block.level === 2 ? 'h4' : 'h5';
      return (
        <Heading className={cn(HEADING_CLASS[block.level], PAGE_CLASS.sectionGap)}>
          {block.text}
        </Heading>
      );
    }
    case 'text':
      return (
        <p className={TEXT_CLASS.paragraph}>
          <InlineText text={block.text} />
        </p>
      );
    case 'list': {
      const List = block.style === 'number' ? 'ol' : 'ul';
      return (
        <List className={cn(LIST_CLASS.list, LIST_CLASS[block.style])}>
          {block.items.map((item, index) => (
            <li key={index} className={block.style === 'check' ? 'flex gap-2' : undefined}>
              {block.style === 'check' && (
                <CircleCheck aria-hidden="true" className={LIST_CLASS.checkIcon} />
              )}
              <span>
                <InlineText text={item} />
              </span>
            </li>
          ))}
        </List>
      );
    }
    case 'image':
      return (
        <figure className={MEDIA_CLASS.figure}>
          <img
            src={resolveContentUrl(block.src)}
            alt={block.alt}
            loading="lazy"
            decoding="async"
            className={cn(MEDIA_CLASS.image, MEDIA_CLASS.imageSize[block.size])}
          />
          {block.caption && (
            <figcaption className={MEDIA_CLASS.caption}>{block.caption}</figcaption>
          )}
        </figure>
      );
    case 'video':
      return <ContentVideo video={block.video} title={block.title} />;
    case 'buttons':
      return (
        <div className={BUTTONS_ROW_CLASS}>
          {block.items.map((button) => (
            <ContentButtonLink key={`${button.label}-${button.url}`} button={button} />
          ))}
        </div>
      );
    case 'callout': {
      const Icon = CALLOUT_ICON[block.tone];
      return (
        <aside className={cn('my-1 flex gap-3 rounded-tile border p-4', CALLOUT_CLASS[block.tone])}>
          <Icon
            aria-hidden="true"
            className={cn('mt-0.5 size-5 shrink-0', CALLOUT_ICON_CLASS[block.tone])}
          />
          <div className="flex flex-col gap-1 text-[15px] leading-relaxed">
            {block.title && <p className="font-semibold text-ink-950">{block.title}</p>}
            <p>
              <InlineText text={block.text} />
            </p>
          </div>
        </aside>
      );
    }
    case 'divider':
      return <hr className={DIVIDER_CLASS} />;
  }
}
