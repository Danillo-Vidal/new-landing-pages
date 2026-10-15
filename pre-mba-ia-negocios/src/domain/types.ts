/**
 * Canonical domain model. `content/course.schema.ts` turns the raw `course.json` into these
 * types, so the rest of the app never deals with raw JSON, empty strings or date strings.
 *
 * Conventions: `null` means "not provided / coming soon"; dates are `Date` instants.
 */
import type { MaterialIconKey } from '../lib/material-icons.ts';

export type LessonId = string;

/** How a lesson becomes available. New strategies extend this union (see release-strategies.ts). */
export type ReleaseRule =
  | { readonly type: 'fixed_date'; readonly date: Date }
  | { readonly type: 'enrollment_offset'; readonly days: number }
  /** Opened by the learner ("Liberar aula") once the previous lesson reaches the unlock trigger. */
  | { readonly type: 'sequential' };

export type VideoSource =
  | { readonly provider: 'youtube'; readonly videoId: string; readonly thumbnail: string | null }
  | {
      readonly provider: 'vimeo';
      readonly videoId: string;
      readonly privacyHash: string | null;
      readonly thumbnail: string | null;
    }
  | {
      readonly provider: 'mp4';
      readonly url: string;
      readonly thumbnail: string | null;
      /** Optional WebVTT captions file. */
      readonly captionsUrl: string | null;
    }
  | {
      readonly provider: 'spalla';
      readonly embedUrl: string;
    };

export type VideoProvider = VideoSource['provider'];

export interface Material {
  readonly id: string;
  readonly label: string;
  readonly icon: MaterialIconKey;
  /** `null` = "Em breve" (unless the material has a `page`). */
  readonly url: string | null;
  /** Rich content shown INSIDE the page when the material is expanded (pages/<id>.json). */
  readonly page: ContentPage | null;
}

/** A clickable button inside a content page: download a file or open a link. */
export interface ContentButton {
  readonly label: string;
  /** `https://…` or a file inside `public/`. */
  readonly url: string;
  readonly icon: MaterialIconKey;
  readonly style: 'primary' | 'secondary';
  /** Asks the browser to download instead of opening (same-site files only). */
  readonly download: boolean;
}

/**
 * Building blocks of a content page. Texts accept `**negrito**` and `[texto](link)`.
 * New block = new union member + schema entry + renderer (the compiler points to each one).
 */
export type ContentBlock =
  | { readonly type: 'heading'; readonly text: string; readonly level: 2 | 3 }
  | { readonly type: 'text'; readonly text: string }
  | {
      readonly type: 'list';
      readonly style: 'bullet' | 'number' | 'check';
      readonly items: readonly string[];
    }
  | {
      readonly type: 'image';
      readonly src: string;
      readonly alt: string;
      readonly caption: string | null;
      readonly size: 'full' | 'medium';
    }
  | { readonly type: 'video'; readonly title: string; readonly video: VideoSource }
  | { readonly type: 'buttons'; readonly items: readonly ContentButton[] }
  | {
      readonly type: 'callout';
      readonly tone: 'info' | 'tip' | 'warning';
      readonly title: string | null;
      readonly text: string;
    }
  | { readonly type: 'divider' };

export type ContentPageTone = 'brand' | 'neutral' | 'plain';

export interface ContentPage {
  /** File name without extension (`pages/guia-de-abertura.json` → "guia-de-abertura"). */
  readonly id: string;
  readonly intro: string | null;
  /** Background/border style of the expanded area (see content-styles.ts). */
  readonly tone: ContentPageTone;
  readonly blocks: readonly ContentBlock[];
}

export interface Community {
  readonly title: string;
  readonly description: string;
  /** `null` = shows the "Espaço para incorporar o Padlet" placeholder. */
  readonly embedUrl: string | null;
}

export interface Lesson {
  readonly id: LessonId;
  readonly order: number;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly release: ReleaseRule;
  /** `null` = "Vídeo em breve". */
  readonly video: VideoSource | null;
  /** Expected video length (`video.duration`), used to count the watched time. `null` = unknown. */
  readonly videoDurationMs: number | null;
  readonly materials: readonly Material[];
  readonly community: Community;
}

export interface JourneyHeader {
  readonly brandName: string;
  readonly logoUrl: string | null;
  readonly label: string;
}

export interface Journey {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  /** IANA time zone used for every release date (e.g. "America/Sao_Paulo"). */
  readonly timezone: string;
  /** Fraction of the video (0-1] that counts as "watched". */
  readonly completionThreshold: number;
  readonly header: JourneyHeader | null;
}

/** What makes the NEXT sequential lesson ready to unlock: a play click or a watched lesson. */
export type UnlockTrigger = 'play' | 'watched';

export interface CourseSettings {
  readonly progression: { readonly unlockNextOn: UnlockTrigger };
  readonly features: {
    /** Shows "Marcar como assistida" / "Desmarcar". */
    readonly allowManualComplete: boolean;
  };
  readonly sound: {
    readonly enabledByDefault: boolean;
    /** Peak gain, 0-1. */
    readonly volume: number;
  };
  readonly animation: { readonly unlockOverlayMs: number };
}

/** When the reward card appears: all lessons opened, or all lessons watched. */
export type RewardUnlockRule = 'all_unlocked' | 'all_watched';

/**
 * 6th card ("Desconto desbloqueado!"). It is NOT a lesson: it never counts in the progress,
 * is never selectable and is derived from the lesson statuses (nothing is persisted).
 */
export interface Reward {
  readonly enabled: boolean;
  readonly unlockWhen: RewardUnlockRule;
  readonly title: string;
  readonly description: string;
  readonly cta: {
    readonly label: string;
    /** `null` = "Link em breve" (disabled button). */
    readonly url: string | null;
    readonly pendingLabel: string;
  };
  /** Screen-reader message when the card is revealed. */
  readonly announce: string;
  /** Extra line in the "Aula liberada!" overlay when that unlock reveals the card. */
  readonly overlayNote: string;
  /** Appended to the help text under the journey heading; `null` = omitted. */
  readonly teaser: string | null;
  /** "Bônus" segment at the end of the progress bar while the card exists. */
  readonly progress: {
    readonly label: string;
    /** Suffix of the progress bar `aria-valuetext` while the bonus exists. */
    readonly valueText: string;
  } | null;
}

export interface Course extends CourseSettings {
  readonly reward: Reward;
  readonly journey: Journey;
  /** Always sorted by `order`. */
  readonly lessons: readonly Lesson[];
}

/** Who is watching and "when" it is. Supplied by an AccessProvider. */
export interface AccessContext {
  readonly userId: string | null;
  readonly enrollmentDate: Date | null;
  readonly now: Date;
}

/**
 * - `locked`      → not released;
 * - `ready`       → sequential lesson that the learner can unlock now ("Liberar aula");
 * - `available`   → released, video not started;
 * - `in_progress` → released, video started but not watched yet;
 * - `completed`   → released and watched.
 */
export type LessonStatus = 'locked' | 'ready' | 'available' | 'in_progress' | 'completed';

export type LockReason =
  'awaiting_release_date' | 'awaiting_enrollment' | 'awaiting_previous_lesson';

export type CompletionSource = 'video' | 'manual';

export interface LessonCompletion {
  /** ISO-8601 instant. */
  readonly completedAt: string;
  /** `video` = watched time reached the threshold; `manual` = "Marcar como assistida". */
  readonly source: CompletionSource;
}

/**
 * Learner progress in ONE lesson. Watched time is internal (never shown) and is measured from
 * timestamps, never by counting timer ticks (background tabs freeze timers).
 */
export interface LessonProgress {
  /** The learner clicked "Liberar aula" (sequential lessons only). */
  readonly unlocked: boolean;
  /** Epoch ms when the current playback segment started; `null` = not counting. */
  readonly playStartedAt: number | null;
  /** Watched time of the closed segments. */
  readonly accumulatedMs: number;
  readonly completion: LessonCompletion | null;
}

/** Progress of ONE journey, keyed by lesson id. Missing lessons have no progress yet. */
export type JourneyProgressRecord = Readonly<Record<LessonId, LessonProgress>>;

/**
 * `playing-time` → counts only while the player reports it is playing (YouTube, Vimeo, MP4);
 * `wallclock`    → counts the elapsed time since the first play (players without events).
 */
export type PlaybackMode = 'playing-time' | 'wallclock';

export interface LessonState {
  readonly lesson: Lesson;
  readonly status: LessonStatus;
  /** When the lesson is (or was) released. `null` when it cannot be known yet. */
  readonly releaseAt: Date | null;
  readonly lockReason: LockReason | null;
}

export interface JourneyProgress {
  readonly total: number;
  readonly released: number;
  readonly completed: number;
  /** 0-100, rounded. */
  readonly releasedPct: number;
  /** 0-100, rounded. */
  readonly completedPct: number;
}
