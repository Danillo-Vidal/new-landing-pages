import { ArrowUpRight, ChevronDown, CircleCheck } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { ContentPageView } from '@/components/content/ContentPageView.tsx';
import { uiText } from '@/content/ui-text.ts';
import type { Material } from '@/domain/types.ts';
import { resolveContentUrl } from '@/lib/assets.ts';
import { cn } from '@/lib/cn.ts';
import { MATERIAL_ICONS } from '@/lib/material-icons.ts';

const ITEM_CLASS =
  'flex h-full min-h-14 w-full items-center gap-3 rounded-tile border px-3 py-2.5 text-sm font-semibold';
const INTERACTIVE_CLASS =
  'group bg-white text-ink-950 transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-600 hover:shadow-soft';
const VISIT_DELAY_MS = 5_000;

function MaterialIcon({
  material,
  isActive,
}: {
  readonly material: Material;
  readonly isActive: boolean;
}) {
  const Icon = MATERIAL_ICONS[material.icon];
  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-xl',
        isActive ? 'bg-brand-50 text-brand-700' : 'bg-neutral-100 text-neutral-500',
      )}
    >
      <Icon aria-hidden="true" className="size-[18px]" />
    </span>
  );
}

/** Green check: the learner already opened this material (saved in the browser). */
function VisitedCheck() {
  return (
    <span className="inline-flex shrink-0 text-brand-600">
      <CircleCheck aria-hidden="true" className="size-[18px]" />
      <span className="sr-only">{uiText.materials.visited}</span>
    </span>
  );
}

interface MaterialItemProps {
  readonly material: Material;
  readonly isOpen: boolean;
  readonly isVisited: boolean;
  readonly buttonId: string;
  readonly panelId: string;
  readonly onToggle: () => void;
  readonly onVisit: () => void;
}

function MaterialItem({
  material,
  isOpen,
  isVisited,
  buttonId,
  panelId,
  onToggle,
  onVisit,
}: MaterialItemProps) {
  if (material.page) {
    return (
      <button
        id={buttonId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className={cn(
          ITEM_CLASS,
          INTERACTIVE_CLASS,
          'text-left',
          isOpen ? 'border-brand-600 ring-1 ring-brand-600' : 'border-neutral-200',
        )}
      >
        <MaterialIcon material={material} isActive />
        <span className="flex-1">{material.label}</span>
        {isVisited && <VisitedCheck />}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-4 text-neutral-400 transition-transform duration-200 ease-out group-hover:text-brand-700',
            isOpen && 'rotate-180 text-brand-700',
          )}
        />
      </button>
    );
  }

  if (!material.url) {
    return (
      <div
        className={cn(
          ITEM_CLASS,
          'border-dashed border-neutral-200 bg-neutral-50 text-neutral-600',
        )}
      >
        <MaterialIcon material={material} isActive={false} />
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
          {material.label}
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-neutral-600">
            {uiText.materials.comingSoon}
          </span>
        </span>
      </div>
    );
  }

  return (
    <a
      href={resolveContentUrl(material.url)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onVisit}
      onAuxClick={(event) => {
        if (event.button === 1) onVisit(); // middle click also opens the link
      }}
      className={cn(ITEM_CLASS, INTERACTIVE_CLASS, 'border-neutral-200')}
    >
      <MaterialIcon material={material} isActive />
      <span className="flex-1">{material.label}</span>
      {isVisited && <VisitedCheck />}
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 text-neutral-400 transition-colors group-hover:text-brand-700"
      />
      <span className="sr-only">{uiText.materials.opensInNewTab}</span>
    </a>
  );
}

interface MaterialsListProps {
  readonly materials: readonly Material[];
  /** Ids of the materials already opened by the learner (shows the green check). */
  readonly visitedIds?: ReadonlySet<string>;
  /** Called when the learner opens a material (link click or content expanded). */
  readonly onVisit?: (materialId: string) => void;
}

/**
 * Buttons generated from `materials[]` (1-8 items, responsive grid). Materials with a `page`
 * expand their content right below the grid (one at a time).
 */
export function MaterialsList({ materials, visitedIds, onVisit }: MaterialsListProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const baseId = useId();
  const visitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingVisitId = useRef<string | null>(null);
  const openMaterial = materials.find((material) => material.id === openId && material.page);

  useEffect(
    () => () => {
      if (visitTimer.current !== null) clearTimeout(visitTimer.current);
    },
    [],
  );

  const clearPendingVisit = (materialId?: string) => {
    if (materialId && pendingVisitId.current !== materialId) return;
    if (visitTimer.current !== null) clearTimeout(visitTimer.current);
    visitTimer.current = null;
    pendingVisitId.current = null;
  };

  const scheduleVisit = (materialId: string) => {
    clearPendingVisit();
    pendingVisitId.current = materialId;
    visitTimer.current = setTimeout(() => {
      visitTimer.current = null;
      pendingVisitId.current = null;
      onVisit?.(materialId);
    }, VISIT_DELAY_MS);
  };

  if (materials.length === 0) {
    return <p className="text-sm text-neutral-600">{uiText.materials.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
        {materials.map((material) => (
          <li key={material.id}>
            <MaterialItem
              material={material}
              isOpen={material.id === openId}
              isVisited={visitedIds?.has(material.id) ?? false}
              buttonId={`${baseId}-${material.id}`}
              panelId={`${baseId}-${material.id}-conteudo`}
              onToggle={() => {
                if (openId !== material.id) {
                  scheduleVisit(material.id);
                } else {
                  clearPendingVisit(material.id);
                }
                setOpenId((current) => (current === material.id ? null : material.id));
              }}
              onVisit={() => scheduleVisit(material.id)}
            />
          </li>
        ))}
      </ul>
      {openMaterial?.page && (
        <ContentPageView
          key={openMaterial.id}
          page={openMaterial.page}
          id={`${baseId}-${openMaterial.id}-conteudo`}
          labelledBy={`${baseId}-${openMaterial.id}`}
          className="animate-fade-up"
        />
      )}
    </div>
  );
}
