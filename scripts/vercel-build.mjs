#!/usr/bin/env node
/**
 * Vercel monorepo build: compile @digipicks/web, then copy apps/web/dist → ./dist
 * so the platform finds Output Directory "dist" at the repository root.
 */
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const webDist = join(repoRoot, 'apps/web/dist');
const vercelDist = join(repoRoot, 'dist');

execSync('pnpm --filter @digipicks/web build', {
  cwd: repoRoot,
  stdio: 'inherit',
  env: { ...process.env, HUSKY: '0' },
});

rmSync(vercelDist, { recursive: true, force: true });
mkdirSync(vercelDist, { recursive: true });
cpSync(webDist, vercelDist, { recursive: true });

console.log(`Vercel output ready at ${vercelDist}`);
