/// <reference types="vite/client" />
import { test } from 'vitest';
import {
  convexTest as baseConvexTest,
  type TestConvex,
} from 'convex-test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import schema from '../schema';

// Vitest "no test in file" guard — this file is a shared helper, not a
// real test suite. The .test.ts naming exists so Convex's deployment
// scanner ignores it (it would otherwise try to bundle convex-test).
test('setup helper module loads', () => {});

// =============================================================================
// Shared convex-test setup. Always use this in *.test.ts so every installed
// Convex component is registered with the in-memory deployment. Drop-in
// replacement for `convex-test`'s own `convexTest` — same signature.
// =============================================================================

export type { TestConvex };

/**
 * Build a fresh test instance with all Convex components pre-registered.
 *
 * Callers must still pass `import.meta.glob('./**\/*.ts')` themselves
 * because Vite statically analyzes glob calls at the call site. The
 * `_schema` argument is preserved for signature compatibility but is
 * always replaced with the canonical project schema so accidental drift
 * cannot land.
 */
export function convexTest(
  _schema: unknown,
  modules: Record<string, () => Promise<unknown>>,
): TestConvex<typeof schema> {
  const t = baseConvexTest(schema, modules);
  rateLimiterTest.register(t);
  return t;
}
