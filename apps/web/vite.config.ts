import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@digipicks/sdk': path.resolve(__dirname, '../../packages/sdk/src'),
      '@digipicks/ds/styles': path.resolve(__dirname, '../../packages/ds/src/styles.css'),
      '@digipicks/ds': path.resolve(__dirname, '../../packages/ds/src'),
      '@digipicks/app-shell': path.resolve(__dirname, '../../packages/app-shell/src'),
      '@digipicks/tokens': path.resolve(__dirname, '../../packages/tokens/src/index.css'),
    },
  },
  optimizeDeps: {
    exclude: ['@digipicks/sdk', '@digipicks/ds', '@digipicks/app-shell'],
  },
});
