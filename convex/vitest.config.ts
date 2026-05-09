import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'edge-runtime',
    // File-level parallelism causes flaky failures when multiple suites
    // register the same Convex component (rate-limiter) — register() touches
    // module-level state that doesn't survive worker isolation cleanly.
    // The suite runs in <2s sequentially, so the cost is negligible.
    fileParallelism: false,
    server: {
      deps: {
        inline: ['convex', 'convex-test'],
      },
    },
  },
});
