import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Architecture guard-rails (see docs/ARCHITECTURE.md). Messages are in pt-BR on purpose. */
const NO_RAW_DATE = [
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message: 'Use o Clock injetado (src/services/clock.ts) para obter a data atual.',
  },
  {
    selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: 'Use o Clock injetado (src/services/clock.ts) para obter a data atual.',
  },
];

const NO_RAW_COLORS = [
  {
    selector: 'Literal[value=/#[0-9A-Fa-f]{3,8}\\b|rgba?\\(|hsla?\\(|oklch\\(/]',
    message: 'Cores só existem como tokens (src/styles/tokens.css). Use as classes do Tailwind.',
  },
  {
    selector: 'TemplateElement[value.raw=/#[0-9A-Fa-f]{3,8}\\b|rgba?\\(|hsla?\\(|oklch\\(/]',
    message: 'Cores só existem como tokens (src/styles/tokens.css). Use as classes do Tailwind.',
  },
];

const NO_BROWSER_STORAGE = {
  globals: [
    { name: 'localStorage', message: 'Acesse o storage apenas via ProgressRepository.' },
    { name: 'sessionStorage', message: 'Acesse o storage apenas via ProgressRepository.' },
  ],
  properties: [
    { object: 'window', property: 'localStorage', message: 'Use ProgressRepository.' },
    { object: 'window', property: 'sessionStorage', message: 'Use ProgressRepository.' },
  ],
};

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': true, 'ts-nocheck': true }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-syntax': ['error', ...NO_RAW_DATE, ...NO_RAW_COLORS],
      'no-restricted-globals': ['error', ...NO_BROWSER_STORAGE.globals],
      'no-restricted-properties': ['error', ...NO_BROWSER_STORAGE.properties],
    },
  },

  {
    files: ['src/**/*.tsx'],
    extends: [reactHooks.configs.flat['recommended-latest'], jsxA11y.flatConfigs.strict],
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  {
    files: ['src/hooks/**/*.ts'],
    extends: [reactHooks.configs.flat['recommended-latest']],
  },

  // Pure layers: no React, no browser, no app/UI imports.
  {
    files: ['src/domain/**/*.ts', 'src/content/**/*.ts', 'src/lib/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-dom'], message: 'Camadas puras não dependem de React.' },
            { group: ['@/*'], message: 'Camadas puras usam imports relativos com extensão (.ts).' },
          ],
        },
      ],
    },
  },

  // The only places allowed to touch the real clock / browser storage.
  {
    files: ['src/services/clock.ts'],
    rules: { 'no-restricted-syntax': ['error', ...NO_RAW_COLORS] },
  },
  {
    files: ['src/services/progress/**/*.ts'],
    rules: { 'no-restricted-globals': 'off', 'no-restricted-properties': 'off' },
  },

  // Tests may build fixtures freely.
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-restricted-syntax': 'off',
    },
  },

  // Node tooling.
  {
    files: ['vite.config.ts', 'scripts/**/*.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['eslint.config.js'],
    extends: [js.configs.recommended, tseslint.configs.disableTypeChecked],
  },

  prettier,
);
