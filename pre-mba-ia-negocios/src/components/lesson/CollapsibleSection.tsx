import { ChevronDown, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import type { CollapseController } from '@/hooks/useCollapse.ts';

interface CollapsibleSectionProps<Section extends string> {
  readonly section: Section;
  readonly collapse: CollapseController<Section>;
  readonly title: string;
  readonly icon: LucideIcon;
  readonly description?: string;
  readonly children: ReactNode;
}

/** Section with a full-width toggle header and a CSS-animated, accessible region. */
export function CollapsibleSection<Section extends string>({
  section,
  collapse,
  title,
  icon: Icon,
  description,
  children,
}: CollapsibleSectionProps<Section>) {
  return (
    <section className="py-6 first:pt-0 last:pb-0">
      <h3>
        <button
          type="button"
          {...collapse.getTriggerProps(section)}
          className="group -m-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-tile p-2 text-left transition-colors duration-200 hover:bg-neutral-50"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Icon aria-hidden="true" className="size-[18px]" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-base font-semibold tracking-[-0.01em] text-ink-950">{title}</span>
            {description && <span className="mt-0.5 text-sm text-neutral-600">{description}</span>}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-5 shrink-0 text-neutral-500 transition-transform duration-200 ease-out group-aria-expanded:rotate-180"
          />
        </button>
      </h3>
      <div {...collapse.getRegionProps(section)} className="collapse-region">
        <div className="collapse-content">
          <div className="pt-5">{children}</div>
        </div>
      </div>
    </section>
  );
}
