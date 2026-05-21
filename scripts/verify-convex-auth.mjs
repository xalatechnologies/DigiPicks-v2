#!/usr/bin/env node
/**
 * Read-only checks for Convex Auth dev setup (no key rotation).
 *
 *   node scripts/verify-convex-auth.mjs
 *   pnpm verify:convex-auth
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i)] = t.slice(i + 1).trim();
  }
  return out;
}

function convexEnvGet(name) {
  try {
    return execSync(`npx convex env get ${name}`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  return false;
}

function ok(msg) {
  console.log(`✓ ${msg}`);
  return true;
}

function warn(msg) {
  console.warn(`⚠ ${msg}`);
}

const rootEnv = readEnvFile(join(repoRoot, '.env.local'));
const webEnv = readEnvFile(join(repoRoot, 'apps/web/.env.local'));

const convexUrl = rootEnv.CONVEX_URL ?? webEnv.VITE_CONVEX_URL;
const viteUrl = webEnv.VITE_CONVEX_URL ?? rootEnv.CONVEX_URL;

let passed = true;

if (!convexUrl) {
  passed = fail('CONVEX_URL / VITE_CONVEX_URL missing in .env.local files');
} else {
  passed = ok(`Deployment URL: ${convexUrl}`) && passed;
}

if (viteUrl && convexUrl && viteUrl !== convexUrl) {
  passed = fail(`VITE_CONVEX_URL (${viteUrl}) !== CONVEX_URL (${convexUrl})`) && false;
} else if (viteUrl) {
  ok('VITE_CONVEX_URL matches CONVEX_URL');
}

const deployment = rootEnv.CONVEX_DEPLOYMENT;
if (deployment) {
  ok(`CONVEX_DEPLOYMENT=${deployment}`);
}

const jwtKey = convexEnvGet('JWT_PRIVATE_KEY');
const jwks = convexEnvGet('JWKS');
const siteUrl = convexEnvGet('SITE_URL');

if (!jwtKey) passed = fail('JWT_PRIVATE_KEY not set on deployment') && false;
else ok('JWT_PRIVATE_KEY is set');

if (!jwks) passed = fail('JWKS not set on deployment') && false;
else ok('JWKS is set');

if (!siteUrl) passed = fail('SITE_URL not set on deployment') && false;
else ok(`SITE_URL=${siteUrl}`);

const webPkg = JSON.parse(readFileSync(join(repoRoot, 'apps/web/package.json'), 'utf8'));
const devScript = webPkg.scripts?.dev ?? '';
const vitePortMatch = devScript.match(/--port\s+(\d+)/);
const vitePort = vitePortMatch?.[1] ?? '5173';

if (siteUrl && !siteUrl.includes(`:${vitePort}`)) {
  warn(
    `Vite dev port is ${vitePort} but SITE_URL is ${siteUrl} — align for OAuth (password auth unaffected)`,
  );
  warn(`  pnpm setup:convex-auth -- --site-url http://localhost:${vitePort}`);
}

const siteHost = convexUrl?.replace('.convex.cloud', '.convex.site');
if (siteHost) {
  const jwksUrl = `${siteHost}/.well-known/jwks.json`;
  try {
    const res = await fetch(jwksUrl);
    if (res.ok) {
      const jwksText = await res.text();
      try {
        const parsed = JSON.parse(jwksText);
        if (!Array.isArray(parsed.keys) || parsed.keys.length === 0) {
          passed =
            fail(
              `JWKS at ${jwksUrl} is valid JSON but has no keys — run pnpm setup:convex-auth -- --rotate`,
            ) && false;
        } else {
          ok(`JWKS endpoint reachable and valid JSON: ${jwksUrl}`);
        }
      } catch {
        passed =
          fail(
            `JWKS at ${jwksUrl} is not valid JSON (often double-encoded JWKS env) — run pnpm setup:convex-auth -- --rotate`,
          ) && false;
      }
    } else {
      passed = fail(`JWKS endpoint ${jwksUrl} returned ${res.status}`) && false;
    }
  } catch (err) {
    passed =
      fail(`JWKS fetch failed: ${err instanceof Error ? err.message : String(err)}`) && false;
  }

  const oidcUrl = `${siteHost}/.well-known/openid-configuration`;
  try {
    const res = await fetch(oidcUrl);
    if (res.ok) {
      const body = await res.json();
      if (body.issuer === siteHost) {
        ok(`OIDC issuer matches deployment site: ${body.issuer}`);
      } else {
        passed = fail(`OIDC issuer mismatch: ${body.issuer} vs ${siteHost}`) && false;
      }
    } else {
      passed = fail(`OIDC config ${oidcUrl} returned ${res.status}`) && false;
    }
  } catch (err) {
    passed =
      fail(`OIDC fetch failed: ${err instanceof Error ? err.message : String(err)}`) && false;
  }
}

if (existsSync(join(repoRoot, 'convex/auth.config.ts'))) {
  ok('convex/auth.config.ts present');
} else {
  passed = fail('convex/auth.config.ts missing') && false;
}

console.log('');
if (passed) {
  console.log('Convex Auth verification passed.');
  process.exit(0);
} else {
  console.log('Convex Auth verification failed. Run `pnpm setup:convex-auth` from repo root.');
  process.exit(1);
}
