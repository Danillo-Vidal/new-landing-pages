import { describe, expect, it } from 'vitest';

import { cloneRawCourse } from '../test/fixtures.ts';
import { type CourseParseResult, parseCourse as parseWithPages } from './course.schema.ts';
import { loadContentPages } from './load-course.ts';

const PAGES = loadContentPages();
const parseCourse = (raw: unknown, pages = PAGES) => parseWithPages(raw, pages);

function expectIssues(result: CourseParseResult) {
  if (result.ok) throw new Error('Expected the course to be invalid');
  return result.issues;
}

function expectCourse(result: CourseParseResult) {
  if (!result.ok) throw new Error(`Expected a valid course: ${JSON.stringify(result.issues)}`);
  return result.course;
}

describe('parseCourse — valid content', () => {
  it('accepts the real course.json', () => {
    const course = expectCourse(parseCourse(cloneRawCourse()));
    expect(course.journey.id).toBe('pre-mba-ia-negocios');
    expect(course.lessons).toHaveLength(5);
  });

  it('reads the sequential release, durations and course settings', () => {
    const course = expectCourse(parseCourse(cloneRawCourse()));
    // Content changes over time (lessons may stay "locked" until published): only check the rules.
    const releaseTypes = new Set(['sequential', 'locked', 'fixed_date', 'enrollment_offset']);
    expect(course.lessons.every((lesson) => releaseTypes.has(lesson.release.type))).toBe(true);
    // Content changes over time ("em breve" lessons may have no duration yet):
    // only check that every filled duration was parsed (ms > 0).
    expect(
      course.lessons.every(
        (lesson) => lesson.videoDurationMs === null || lesson.videoDurationMs > 0,
      ),
    ).toBe(true);
    expect(course.progression).toEqual({ unlockNextOn: 'play' });
    expect(course.features).toEqual({ allowManualComplete: false });
    expect(course.sound).toEqual({ enabledByDefault: true, volume: 0.12 });
    // Content changes over time: only check the parsed shape.
    expect(course.animation.unlockOverlayMs).toBeGreaterThanOrEqual(1600);
  });

  it('defaults to sequential release and default settings when omitted', () => {
    const raw = cloneRawCourse() as unknown as Record<string, unknown> & {
      lessons: Record<string, unknown>[];
    };
    delete raw.progression;
    delete raw.features;
    delete raw.sound;
    delete raw.animation;
    delete raw.lessons[1]!.release;
    const course = expectCourse(parseCourse(raw));
    expect(course.lessons[1]?.release).toEqual({ type: 'sequential' });
    expect(course.progression.unlockNextOn).toBe('play');
    expect(course.animation.unlockOverlayMs).toBe(2200);
  });

  it('keeps the duration of a lesson whose video is not published yet', () => {
    const raw = cloneRawCourse();
    raw.lessons[1]!.video = { provider: 'spalla', embedUrl: '', duration: '18:45' };
    const lesson = expectCourse(parseCourse(raw)).lessons[1];
    expect(lesson?.video).toBeNull();
    expect(lesson?.videoDurationMs).toBe(1_125_000);
  });

  it('converts release dates into instants and sorts lessons by order', () => {
    const raw = cloneRawCourse() as unknown as { lessons: { release: unknown }[] };
    raw.lessons[0]!.release = { type: 'fixed_date', date: '2026-10-13T00:00:00-03:00' };
    raw.lessons.reverse();
    const course = expectCourse(parseCourse(raw));
    expect(course.lessons.map((lesson) => lesson.order)).toEqual([1, 2, 3, 4, 5]);
    const firstRelease = course.lessons[0]?.release;
    expect(firstRelease?.type === 'fixed_date' && firstRelease.date.toISOString()).toBe(
      '2026-10-13T03:00:00.000Z',
    );
  });

  it('accepts date-only values as midnight in the journey time zone', () => {
    const raw = cloneRawCourse() as unknown as { lessons: { release: unknown }[] };
    raw.lessons[1]!.release = { type: 'fixed_date', date: '2026-10-20' };
    const release = expectCourse(parseCourse(raw)).lessons[1]?.release;
    expect(release?.type === 'fixed_date' && release.date.toISOString()).toBe(
      '2026-10-20T03:00:00.000Z',
    );
  });

  it('accepts a manual lock ("locked") until the content is published', () => {
    const raw = cloneRawCourse() as unknown as { lessons: { release: unknown }[] };
    raw.lessons[1]!.release = { type: 'locked' };
    expect(expectCourse(parseCourse(raw)).lessons[1]?.release).toEqual({ type: 'locked' });
  });

  it('accepts enrollment_offset releases (phase 2)', () => {
    const raw = cloneRawCourse() as unknown as { lessons: { release: unknown }[] };
    raw.lessons[1]!.release = { type: 'enrollment_offset', days: 10 };
    expect(expectCourse(parseCourse(raw)).lessons[1]?.release).toEqual({
      type: 'enrollment_offset',
      days: 10,
    });
  });

  it('turns empty links into null ("coming soon")', () => {
    const raw = cloneRawCourse();
    (raw.lessons[0] as { video: unknown }).video = {
      provider: 'youtube',
      videoId: '',
      thumbnail: '',
      duration: '',
    };
    raw.lessons[0]!.materials[0]!.url = '';
    raw.lessons[0]!.community.embedUrl = '';
    const lesson = expectCourse(parseCourse(raw)).lessons[0];
    expect(lesson?.video).toBeNull();
    expect(lesson?.materials[0]?.url).toBeNull();
    expect(lesson?.community.embedUrl).toBeNull();
  });

  it('normalizes a pasted YouTube URL into its video ID', () => {
    const raw = cloneRawCourse();
    (raw.lessons[0] as { video: unknown }).video = {
      provider: 'youtube',
      videoId: 'https://www.youtube.com/watch?v=M7lc1UVf-VE&t=10s',
      thumbnail: '',
      duration: '',
    };
    expect(expectCourse(parseCourse(raw)).lessons[0]?.video).toEqual({
      provider: 'youtube',
      videoId: 'M7lc1UVf-VE',
      thumbnail: null,
    });
  });

  it('normalizes unlisted Vimeo links keeping the privacy hash', () => {
    const raw = cloneRawCourse() as unknown as { lessons: { video: unknown }[] };
    raw.lessons[0]!.video = {
      provider: 'vimeo',
      videoId: 'https://vimeo.com/123456789/abcdef1234',
    };
    expect(expectCourse(parseCourse(raw)).lessons[0]?.video).toEqual({
      provider: 'vimeo',
      videoId: '123456789',
      privacyHash: 'abcdef1234',
      thumbnail: null,
    });
  });

  it('accepts a Spalla player embed URL', () => {
    const raw = cloneRawCourse();
    raw.lessons[0]!.video = {
      provider: 'spalla',
      embedUrl:
        'https://beyond.spalla.io/player/?video=019dac2f-eb29-747c-bdcd-c76269c44d6a;&subtitleLanguage=null',
      duration: '',
    };
    expect(expectCourse(parseCourse(raw)).lessons[0]?.video).toEqual({
      provider: 'spalla',
      embedUrl:
        'https://beyond.spalla.io/player/?video=019dac2f-eb29-747c-bdcd-c76269c44d6a;&subtitleLanguage=null',
    });
  });

  it('accepts files from the public folder as material links', () => {
    const raw = cloneRawCourse();
    raw.lessons[0]!.materials[0]!.url = 'materiais/aula-1/texto-de-apoio.pdf';
    expect(expectCourse(parseCourse(raw)).lessons[0]?.materials[0]?.url).toBe(
      'materiais/aula-1/texto-de-apoio.pdf',
    );
  });
});

describe('parseCourse — invalid content (friendly errors)', () => {
  it('points to the exact lesson and field of an invalid duration', () => {
    const raw = cloneRawCourse();
    raw.lessons[2]!.video.duration = '22:99';
    const issues = expectIssues(parseCourse(raw));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.location).toBe('lessons[2] (aula-3) › video.duration');
    expect(issues[0]?.message).toMatch(/Duração inválida/);
  });

  it('rejects an unknown unlock trigger and an out-of-range volume', () => {
    const raw = cloneRawCourse() as unknown as Record<string, unknown>;
    raw.progression = { unlockNextOn: 'sometimes' };
    raw.sound = { enabledByDefault: true, volume: 3 };
    const locations = expectIssues(parseCourse(raw)).map((issue) => issue.location);
    expect(locations).toEqual(['progression.unlockNextOn', 'sound.volume']);
  });

  it('points to the exact lesson and field of an invalid date', () => {
    const raw = cloneRawCourse() as unknown as { lessons: { release: unknown }[] };
    raw.lessons[2]!.release = { type: 'fixed_date', date: '27/10/2026' };
    const issues = expectIssues(parseCourse(raw));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.location).toBe('lessons[2] (aula-3) › release.date');
    expect(issues[0]?.message).toMatch(/Data inválida/);
  });

  it('reports missing required fields', () => {
    const raw = cloneRawCourse() as unknown as { lessons: Record<string, unknown>[] };
    delete raw.lessons[0]!.title;
    const issues = expectIssues(parseCourse(raw));
    expect(issues[0]).toEqual({
      location: 'lessons[0] (aula-1) › title',
      message: 'Campo obrigatório ausente.',
    });
  });

  it('reports typos in field names', () => {
    const raw = cloneRawCourse() as unknown as { lessons: Record<string, unknown>[] };
    raw.lessons[0]!.subtitel = 'Oops';
    expect(expectIssues(parseCourse(raw))[0]?.message).toMatch(/Campo desconhecido: "subtitel"/);
  });

  it('rejects icons outside the icon map', () => {
    const raw = cloneRawCourse();
    raw.lessons[0]!.materials[0]!.icon = 'rocket';
    const issue = expectIssues(parseCourse(raw))[0];
    expect(issue?.location).toBe('lessons[0] (aula-1) › materials[0].icon');
    expect(issue?.message).toMatch(/Ícone inválido/);
  });

  it('rejects insecure (http) links', () => {
    const raw = cloneRawCourse();
    raw.lessons[0]!.materials[0]!.url = 'http://exemplo.com/arquivo.pdf';
    expect(expectIssues(parseCourse(raw))[0]?.message).toMatch(/Link inválido/);
  });

  it('rejects duplicated lesson ids and orders', () => {
    const raw = cloneRawCourse();
    raw.lessons[1]!.id = 'aula-1';
    raw.lessons[1]!.order = 1;
    const messages = expectIssues(parseCourse(raw)).map((issue) => issue.message);
    expect(messages.some((message) => message.includes('id "aula-1" está repetido'))).toBe(true);
    expect(messages.some((message) => message.includes('ordem 1 está repetida'))).toBe(true);
  });

  it('rejects an unknown release type and invalid video provider', () => {
    const raw = cloneRawCourse() as unknown as { lessons: Record<string, unknown>[] };
    raw.lessons[0]!.release = { type: 'weekly' };
    raw.lessons[1]!.video = { provider: 'tiktok', videoId: 'x' };
    const messages = expectIssues(parseCourse(raw)).map((issue) => issue.message);
    expect(messages).toContain(
      'Tipo de liberação inválido. Use "sequential", "locked", "fixed_date" ou "enrollment_offset".',
    );
    expect(messages).toContain(
      'Provedor de vídeo inválido. Use "youtube", "vimeo", "mp4" ou "spalla".',
    );
  });

  it('rejects Spalla embed URLs from other hosts', () => {
    const raw = cloneRawCourse();
    raw.lessons[0]!.video = {
      provider: 'spalla',
      embedUrl: 'https://example.com/player',
      duration: '',
    };
    expect(expectIssues(parseCourse(raw))[0]?.message).toMatch(/Link da Spalla inválido/);
  });

  it('rejects an invalid time zone and threshold', () => {
    const raw = cloneRawCourse();
    raw.journey.timezone = 'Brasil/Sao Paulo';
    raw.journey.completionThreshold = 90;
    const locations = expectIssues(parseCourse(raw)).map((issue) => issue.location);
    expect(locations).toEqual(['journey.timezone', 'journey.completionThreshold']);
  });

  it('rejects more than 8 materials in a lesson', () => {
    const raw = cloneRawCourse();
    const material = raw.lessons[0]!.materials[0]!;
    raw.lessons[0]!.materials = Array.from({ length: 9 }, (_, index) => ({
      ...material,
      id: `material-${index}`,
    }));
    expect(expectIssues(parseCourse(raw))[0]?.message).toMatch(/no máximo 8 materiais/);
  });

  it('rejects content that is not an object', () => {
    expect(expectIssues(parseCourse(null))[0]?.location).toBe('course.json');
  });
});

describe('parseCourse — expandable content pages', () => {
  /** The real content may have no page material yet ("em breve"), so these tests add their own. */
  function courseWithGuidePage() {
    const raw = cloneRawCourse() as unknown as {
      lessons: { materials: Record<string, unknown>[] }[];
    };
    raw.lessons[0]!.materials[1] = {
      id: 'guia',
      label: 'Guia de Abertura',
      icon: 'guide',
      page: 'guia-de-abertura',
    };
    return raw;
  }

  const guide = {
    intro: 'Introdução',
    blocks: [
      { type: 'heading', text: 'Título' },
      { type: 'text', text: 'Texto com **negrito** e [link](https://exemplo.com).' },
      { type: 'buttons', items: [{ label: 'Baixar', url: 'materiais/guia.pdf', download: true }] },
      { type: 'video', title: 'Vídeo', video: { provider: 'youtube', videoId: 'M7lc1UVf-VE' } },
    ],
  };

  it('resolves "page" into the content page with defaults', () => {
    const material = expectCourse(
      parseCourse(courseWithGuidePage(), { ...PAGES, 'guia-de-abertura': guide }),
    ).lessons[0]?.materials.find((item) => item.id === 'guia');
    expect(material?.url).toBeNull();
    expect(material?.page).toMatchObject({
      id: 'guia-de-abertura',
      intro: 'Introdução',
      tone: 'brand',
    });
    expect(material?.page?.blocks[0]).toEqual({ type: 'heading', text: 'Título', level: 2 });
    expect(material?.page?.blocks[2]).toEqual({
      type: 'buttons',
      items: [
        {
          label: 'Baixar',
          url: 'materiais/guia.pdf',
          icon: 'link',
          style: 'secondary',
          download: true,
        },
      ],
    });
    expect(material?.page?.blocks[3]).toMatchObject({ video: { provider: 'youtube' } });
  });

  it('points to a missing page file', () => {
    const issue = expectIssues(parseCourse(courseWithGuidePage(), {}))[0];
    expect(issue?.location).toBe('lessons[0] (aula-1) › materials[1].page');
    expect(issue?.message).toMatch(/src\/content\/pages\/guia-de-abertura\.json/);
  });

  it('points to the exact block and field of an invalid page', () => {
    const broken = {
      blocks: [
        { type: 'text', text: 'ok' },
        { type: 'image', src: 'http://inseguro.com/a.png', alt: 'Foto' },
        { type: 'text', text: '[x](http://inseguro.com)' },
      ],
    };
    const messages = expectIssues(
      parseCourse(courseWithGuidePage(), { 'guia-de-abertura': broken }),
    ).map((issue) => issue.message);
    expect(messages[0]).toMatch(
      /^pages\/guia-de-abertura\.json › blocks\[1\]\.src — Link inválido/,
    );
    expect(messages[1]).toMatch(
      /^pages\/guia-de-abertura\.json › blocks\[2\]\.text — Link inválido no texto/,
    );
  });

  it('rejects a material with both "url" and "page"', () => {
    const raw = courseWithGuidePage();
    raw.lessons[0]!.materials[1]!.url = 'https://exemplo.com';
    expect(expectIssues(parseCourse(raw))[0]?.message).toMatch(/OU "page"/);
  });

  it('accepts every bundled page file (including the example with all blocks)', () => {
    for (const [id, page] of Object.entries(PAGES)) {
      const raw = cloneRawCourse() as unknown as {
        lessons: { materials: Record<string, unknown>[] }[];
      };
      raw.lessons[0]!.materials[1]!.page = id;
      expectCourse(parseCourse(raw, { ...PAGES, [id]: page }));
    }
  });
});

describe('parseCourse — reward card', () => {
  type RawReward = { reward: Record<string, unknown> & { cta: Record<string, unknown> } };

  it('reads the reward block (empty URL = "Link em breve")', () => {
    const raw = cloneRawCourse() as unknown as RawReward;
    raw.reward.cta.url = '';
    const { reward } = expectCourse(parseCourse(raw));
    expect(reward).toMatchObject({ enabled: true, unlockWhen: 'all_unlocked' });
    expect(reward.cta.url).toBeNull();
  });

  it('allows hiding the reward label while keeping its accessible value text', () => {
    const raw = cloneRawCourse() as unknown as RawReward;
    (raw.reward.progress as Record<string, unknown>).label = '';
    const { reward } = expectCourse(parseCourse(raw));
    expect(reward.progress).toEqual({ label: '', valueText: 'Desconto incluído.' });
  });

  it('accepts an https link', () => {
    const raw = cloneRawCourse() as unknown as RawReward;
    raw.reward.cta.url = 'https://www.xpeducacao.com.br/mba';
    expect(expectCourse(parseCourse(raw)).reward.cta.url).toBe('https://www.xpeducacao.com.br/mba');
  });

  it('rejects an unknown rule and a javascript: link, pointing to the field', () => {
    const raw = cloneRawCourse() as unknown as RawReward;
    raw.reward.unlockWhen = 'sempre';
    raw.reward.cta.url = 'javascript:alert(1)';
    const issues = expectIssues(parseCourse(raw));
    expect(issues.map((issue) => issue.location)).toEqual(['reward.unlockWhen', 'reward.cta.url']);
    expect(issues[1]?.message).toMatch(/URL inválida/);
  });
});
