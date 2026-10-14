import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

import { courseContentPlugin } from './scripts/vite-plugin-course-content.ts';

/** Normalizes the deploy base so both "repo" and "/repo/" work in VITE_BASE_PATH. */
function normalizeBasePath(value: string | undefined): string {
  const trimmed = (value ?? '').trim();
  if (trimmed === '' || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    base: normalizeBasePath(env.VITE_BASE_PATH),
    plugins: [courseContentPlugin(), react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      target: 'es2022',
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          notFound: fileURLToPath(new URL('./404.html', import.meta.url)),
        },
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
      restoreMocks: true,
    },
  };
});
