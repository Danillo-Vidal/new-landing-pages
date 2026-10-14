import type { ContentPage } from '@/domain/types.ts';
import { cn } from '@/lib/cn.ts';

import { PAGE_CLASS, PAGE_TONE_CLASS } from './content-styles.ts';
import { ContentBlockView } from './ContentBlockView.tsx';

interface ContentPageViewProps {
  readonly page: ContentPage;
  readonly id?: string;
  readonly labelledBy?: string;
  readonly className?: string;
}

/** Renders a content page (pages/<id>.json): optional intro + blocks, in order. */
export function ContentPageView({ page, id, labelledBy, className }: ContentPageViewProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(PAGE_CLASS.container, PAGE_TONE_CLASS[page.tone], className)}
    >
      {page.intro && <p className={cn(PAGE_CLASS.intro, 'mb-5')}>{page.intro}</p>}
      <div className={PAGE_CLASS.blocks}>
        {page.blocks.map((block, index) => (
          <ContentBlockView key={index} block={block} />
        ))}
      </div>
    </section>
  );
}
