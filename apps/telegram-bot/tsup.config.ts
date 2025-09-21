import { defineConfig } from 'tsup';

export default defineConfig([
  // CLI build with shebang
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    sourcemap: true,
    clean: true,
    target: 'node18',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  // Library build without shebang
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: false,
    sourcemap: true,
    clean: false,
    target: 'node18',
  },
]);
