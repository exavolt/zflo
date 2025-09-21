// ESLint v9 flat config for ZFlo monorepo
// Mirrors previous .eslintrc.json with headless/DOM restrictions for @zflo/core and @zflo/react

import parser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '.eslintrc.cjs',
      'eslint.config.mjs',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        // Enable type-aware rules across the monorepo without listing every project
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
  // @zflo/core: forbid DOM and React imports; enforce headless
  {
    files: ['packages/core/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: ['react', 'react-dom'] }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "Identifier[name='window']",
          message: "DOM global 'window' is not allowed in @zflo/core.",
        },
        {
          selector: "Identifier[name='document']",
          message: "DOM global 'document' is not allowed in @zflo/core.",
        },
      ],
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            Window: "DOM type 'Window' is not allowed in @zflo/core.",
            Document: "DOM type 'Document' is not allowed in @zflo/core.",
            HTMLElement: "DOM type 'HTMLElement' is not allowed in @zflo/core.",
            Node: "DOM type 'Node' is not allowed in @zflo/core.",
            KeyboardEvent:
              "DOM type 'KeyboardEvent' is not allowed in @zflo/core.",
          },
        },
      ],
    },
  },
  // @zflo/react: forbid DOM usage and web-only libraries; keep headless
  {
    files: ['packages/react/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['react-dom'],
          patterns: [
            '@radix-ui/*',
            'lucide-react',
            'tailwindcss*',
            'tw-animate-css',
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "Identifier[name='window']",
          message:
            "Use headless patterns; DOM global 'window' is restricted in @zflo/react. Put web-only logic in @zflo/react-web.",
        },
        {
          selector: "Identifier[name='document']",
          message:
            "Use headless patterns; DOM global 'document' is restricted in @zflo/react. Put web-only logic in @zflo/react-web.",
        },
      ],
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            Window:
              'Use headless patterns; DOM types are restricted in @zflo/react.',
            Document:
              'Use headless patterns; DOM types are restricted in @zflo/react.',
            HTMLElement:
              'Use headless patterns; DOM types are restricted in @zflo/react.',
            Node: 'Use headless patterns; DOM types are restricted in @zflo/react.',
            KeyboardEvent:
              'Use headless patterns; DOM types are restricted in @zflo/react.',
          },
        },
      ],
    },
  },
  // Tests: allow parsing even if not included in tsconfig via allowDefaultProject
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        // Disable type-aware project service for tests to avoid tsconfig inclusion errors
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  // Vitest config files: also disable project service
  {
    files: ['**/vitest.config.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
];
