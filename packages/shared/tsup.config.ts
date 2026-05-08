import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/types/index.ts', 'src/constants.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
});
