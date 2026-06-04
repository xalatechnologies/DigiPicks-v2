#!/usr/bin/env node
/**
 * Vercel monorepo build: compile @digipicks/web, copy apps/web/dist → ./dist.
 * Finds the repo root even when Vercel cwd is a subdirectory.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

function findRepoRoot(startDir) {
  let dir = startDir;
  while (true) {
    if (
      existsSync(join(dir, 'pnpm-workspace.yaml')) &&
      existsSync(join(dir, 'apps/web/package.json'))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const fromScript = findRepoRoot(join(scriptDir, '..'));
const fromCwd = findRepoRoot(process.cwd());
const repoRoot = fromScript ?? fromCwd;

if (!repoRoot) {
  console.error(
    '[vercel-build] Could not find monorepo root. Set Vercel Root Directory to the repository root (not apps/web).',
  );
  process.exit(1);
}

const webDir = join(repoRoot, 'apps/web');
const webDist = join(webDir, 'dist');
const vercelDist = join(repoRoot, 'dist');

console.log(`[vercel-build] repo root: ${repoRoot}`);
console.log(`[vercel-build] building @digipicks/web…`);

const env = {
  ...process.env,
  HUSKY: '0',
  NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--max-old-space-size=6144',
};

try {
  execSync('pnpm run build', {
    cwd: webDir,
    stdio: 'inherit',
    env,
    shell: true,
  });
} catch (err) {
  console.error('[vercel-build] vite build failed in apps/web');
  process.exit(typeof err.status === 'number' ? err.status : 1);
}

if (!existsSync(join(webDist, 'index.html'))) {
  console.error(`[vercel-build] Missing ${join(webDist, 'index.html')} after build`);
  process.exit(1);
}

rmSync(vercelDist, { recursive: true, force: true });
mkdirSync(vercelDist, { recursive: true });
cpSync(webDist, vercelDist, { recursive: true });

console.log(`[vercel-build] output ready at ${vercelDist}`);
