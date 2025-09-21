import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@zflo/core': resolve(__dirname, '../../packages/core/src'),
      '@zflo/react': resolve(__dirname, '../../packages/react/src'),
      '@zflo/ui-react-tw': resolve(__dirname, '../../packages/ui-react-tw/src'),
      '@zflo/platform-core': resolve(
        __dirname,
        '../../packages/platform-core/src'
      ),
    },
  },
  server: {
    port: 3001,
  },
});
