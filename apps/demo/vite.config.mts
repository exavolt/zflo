import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@zflo/core': path.resolve(__dirname, '../../packages/core/src'),
      '@zflo/react': path.resolve(__dirname, '../../packages/react/src'),
      '@zflo/ui-react-tw': path.resolve(__dirname, '../../packages/ui-react-tw/src'),
      '@zflo/format-mermaid': path.resolve(
        __dirname,
        '../../packages/format-mermaid/src'
      ),
      '@zflo/viz-reactflow': path.resolve(
        __dirname,
        '../../packages/viz-reactflow/src'
      ),
      '@zflo/viz-mermaid': path.resolve(
        __dirname,
        '../../packages/viz-mermaid/src'
      ),
    },
  },
});
