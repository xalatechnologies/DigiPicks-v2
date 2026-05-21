import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  // Vite-only vars live in `apps/web/.env.local`; Convex CLI uses repo-root `.env.local`.
  envDir: path.resolve(__dirname),
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'convex', 'convex/react', '@convex-dev/auth'],
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
