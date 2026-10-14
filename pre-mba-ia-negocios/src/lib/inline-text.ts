/**
 * Tiny, safe inline formatting for content texts: `**negrito**` and `[texto](link)`.
 * Produces tokens (never HTML), so content can not inject markup or scripts.
 */
export type InlineToken =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'bold'; readonly text: string }
  | { readonly type: 'link'; readonly text: string; readonly url: string };

const INLINE_PATTERN = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
const SAFE_LINK_PATTERN = /^(https:\/\/|\/?(?!.*\.\.)[A-Za-z0-9_\-./]+$)/;

/** `https://…` or a file inside `public/` (e.g. "materiais/guia.pdf"). */
export function isSafeContentLink(url: string): boolean {
  return SAFE_LINK_PATTERN.test(url) && !/^\/\//.test(url);
}

export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    if (match.index > lastIndex)
      tokens.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    const [whole, bold, label, url] = match;
    if (bold !== undefined) tokens.push({ type: 'bold', text: bold });
    else if (label !== undefined && url !== undefined && isSafeContentLink(url))
      tokens.push({ type: 'link', text: label, url });
    else tokens.push({ type: 'text', text: whole });
    lastIndex = match.index + whole.length;
  }
  if (lastIndex < text.length) tokens.push({ type: 'text', text: text.slice(lastIndex) });
  return tokens;
}

/** Links written with `[texto](link)` that are not allowed (used to report content errors). */
export function findUnsafeInlineLinks(text: string): string[] {
  return [...text.matchAll(INLINE_PATTERN)]
    .map(([, , label, url]) => (label !== undefined && url !== undefined ? url : null))
    .filter((url): url is string => url !== null && !isSafeContentLink(url));
}
