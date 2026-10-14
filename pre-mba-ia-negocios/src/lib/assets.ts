const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

/**
 * Resolves a content link. Absolute URLs are kept; relative paths (files placed in
 * `public/`, e.g. "materiais/aula-1.pdf") are prefixed with the deploy base path so they
 * work under `usuario.github.io/nome-do-repo/`.
 */
export function resolveContentUrl(
  value: string,
  basePath: string = import.meta.env.BASE_URL,
): string {
  if (ABSOLUTE_URL_PATTERN.test(value)) return value;
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return `${normalizedBase}${value.replace(/^\.?\/+/, '')}`;
}
