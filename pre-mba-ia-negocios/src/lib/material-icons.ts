import {
  BookOpen,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Headphones,
  LayoutTemplate,
  Lightbulb,
  Link,
  type LucideIcon,
  Presentation,
  Video,
} from 'lucide-react';

/**
 * THE single icon map used by course.json (`materials[].icon`).
 * To offer a new icon to content editors, add ONE line here; the schema picks it up
 * automatically and `docs/CONTENT_GUIDE.md` lists the available keys.
 */
export const MATERIAL_ICONS = {
  text: FileText,
  guide: BookOpen,
  slides: Presentation,
  spreadsheet: FileSpreadsheet,
  video: Video,
  audio: Headphones,
  link: Link,
  download: Download,
  exercise: ClipboardList,
  template: LayoutTemplate,
  tip: Lightbulb,
} as const satisfies Record<string, LucideIcon>;

export type MaterialIconKey = keyof typeof MATERIAL_ICONS;

export const MATERIAL_ICON_KEYS = Object.keys(MATERIAL_ICONS) as [
  MaterialIconKey,
  ...MaterialIconKey[],
];
