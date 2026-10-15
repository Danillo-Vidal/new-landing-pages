/**
 * Builds every page of the repository into `_site/` (the folder published on GitHub Pages).
 *
 * A page is any top-level folder (lowercase, numbers and hyphens) that has:
 *   - a `package.json`  → `npm ci`, `npm run check` (if it exists), `npm run build`,
 *                         then `dist/` is copied to `_site/<pasta>/`;
 *   - or an `index.html` (static page) → the folder is copied as is.
 *
 * Vite pages receive VITE_BASE_PATH="/<repo>/<pasta>/" so assets resolve under the subpath.
 *
 * Usage:  node scripts/build-all.mjs              (local test, base "/")
 *         REPO_BASE=/new-landing-pages/ node scripts/build-all.mjs
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const OUTPUT_DIR = '_site';
const ROOT_FILES = ['index.html', '404.html'];
const NOT_PAGES = new Set(['node_modules', 'scripts', OUTPUT_DIR]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeBase(value) {
  const trimmed = (value ?? '').trim().replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? '/' : `/${trimmed}/`;
}

function run(command, cwd, extraEnv = {}) {
  console.log(`\n▶ [${cwd}] ${command}`);
  execSync(command, { cwd, stdio: 'inherit', env: { ...process.env, ...extraEnv } });
}

const repoBase = normalizeBase(process.env.REPO_BASE);

rmSync(OUTPUT_DIR, { recursive: true, force: true });
mkdirSync(OUTPUT_DIR);
for (const file of ROOT_FILES) cpSync(file, join(OUTPUT_DIR, file));

const folders = readdirSync('.', { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && !NOT_PAGES.has(entry.name))
  .map((entry) => entry.name);

const published = [];
for (const name of folders) {
  const isVitePage = existsSync(join(name, 'package.json'));
  const isStaticPage = existsSync(join(name, 'index.html'));
  if (!isVitePage && !isStaticPage) continue;

  if (!SLUG_PATTERN.test(name)) {
    throw new Error(
      `A pasta "${name}" vira o endereço da página. Use só minúsculas, números e hífens ` +
        '(ex.: "pre-mba-ia-negocios").',
    );
  }

  if (isVitePage) {
    run('npm ci', name);
    run('npm run check --if-present', name);
    run('npm run build', name, { VITE_BASE_PATH: `${repoBase}${name}/` });
    cpSync(join(name, 'dist'), join(OUTPUT_DIR, name), { recursive: true });
  } else {
    cpSync(name, join(OUTPUT_DIR, name), { recursive: true });
  }
  published.push(`${repoBase}${name}/`);
}

if (published.length === 0) throw new Error('Nenhuma página encontrada para publicar.');
console.log(`\n✔ ${published.length} página(s) prontas em ${OUTPUT_DIR}/:\n  ${published.join('\n  ')}`);
