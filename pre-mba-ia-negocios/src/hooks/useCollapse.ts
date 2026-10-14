import { useCallback, useId, useMemo, useState } from 'react';

interface TriggerProps {
  readonly id: string;
  readonly 'aria-expanded': boolean;
  readonly 'aria-controls': string;
  readonly onClick: () => void;
}

interface RegionProps {
  readonly id: string;
  readonly role: 'region';
  readonly 'aria-labelledby': string;
  readonly 'data-state': 'open' | 'closed';
}

export interface CollapseController<Section extends string> {
  readonly isOpen: (section: Section) => boolean;
  readonly areAllOpen: boolean;
  readonly toggleAll: () => void;
  readonly getTriggerProps: (section: Section) => TriggerProps;
  readonly getRegionProps: (section: Section) => RegionProps;
}

/**
 * State + accessible wiring for a group of collapsible sections, including
 * "Expandir tudo / Recolher tudo". The animation itself is pure CSS (`collapse-region`).
 */
export function useCollapse<Section extends string>(
  sections: readonly Section[],
): CollapseController<Section> {
  const baseId = useId();
  const [openSections, setOpenSections] = useState<ReadonlySet<Section>>(() => new Set(sections));

  const isOpen = useCallback((section: Section) => openSections.has(section), [openSections]);
  const areAllOpen = sections.every((section) => openSections.has(section));

  const toggle = useCallback((section: Section) => {
    setOpenSections((previous) => {
      const next = new Set(previous);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setOpenSections(areAllOpen ? new Set() : new Set(sections));
  }, [areAllOpen, sections]);

  return useMemo(() => {
    const triggerId = (section: Section) => `${baseId}-${section}-trigger`;
    const regionId = (section: Section) => `${baseId}-${section}-region`;
    return {
      isOpen,
      areAllOpen,
      toggleAll,
      getTriggerProps: (section) => ({
        id: triggerId(section),
        'aria-expanded': isOpen(section),
        'aria-controls': regionId(section),
        onClick: () => {
          toggle(section);
        },
      }),
      getRegionProps: (section) => ({
        id: regionId(section),
        role: 'region',
        'aria-labelledby': triggerId(section),
        'data-state': isOpen(section) ? 'open' : 'closed',
      }),
    };
  }, [baseId, isOpen, areAllOpen, toggleAll, toggle]);
}
