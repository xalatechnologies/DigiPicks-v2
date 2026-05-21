#!/usr/bin/env node
/**
 * Configure @convex-dev/auth env on the linked Convex deployment.
 *
 * Default (idempotent): set SITE_URL only; keep existing JWT_PRIVATE_KEY + JWKS.
 * --rotate: regenerate JWT keys (invalidates all browser sessions).
 *
 *   node scripts/setup-convex-auth-env.mjs
 *   node scripts/setup-convex-auth-env.mjs --site-url http://localhost:5173
 *   node scripts/setup-convex-auth-env.mjs --rotate
 */
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportJWK, exportPKCS8, generateKeyPair } from 'jose';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const rotate = args.includes('--rotate');
const siteUrlFlag = args.find((a) => a.startsWith('--site-url='));
const siteUrl = siteUrlFlag
  ? siteUrlFlag.split('=')[1]
  : args.includes('--site-url')
    ? args[args.indexOf('--site-url') + 1]
    : 'http://localhost:5173';

function convexEnvGet(name) {
  try {
    const out = execSync(`npx convex env get ${name}`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

const existingPrivateKey = convexEnvGet('JWT_PRIVATE_KEY');
const existingJwks = convexEnvGet('JWKS');
const hasKeys = Boolean(existingPrivateKey && existingJwks);

const lines = [`SITE_URL=${JSON.stringify(siteUrl)}`];

if (rotate || !hasKeys) {
  if (rotate && hasKeys) {
    console.log('Rotating JWT keys (--rotate). All signed-in browsers must sign in again.');
  } else if (!hasKeys) {
    console.log('No JWT_PRIVATE_KEY/JWKS on deployment — generating new key pair.');
  }
  const keys = await generateKeyPair('RS256', { extractable: true });
  const privateKey = (await exportPKCS8(keys.privateKey)).trimEnd().replace(/\n/g, ' ');
  const publicKey = await exportJWK(keys.publicKey);
  const jwksObject = { keys: [{ use: 'sig', ...publicKey }] };
  lines.push(`JWT_PRIVATE_KEY=${JSON.stringify(privateKey)}`);
  // Single JSON encoding — do not JSON.stringify an already-stringified JWKS (breaks /.well-known/jwks.json).
  lines.push(`JWKS=${JSON.stringify(jwksObject)}`);
} else {
  console.log('Keeping existing JWT_PRIVATE_KEY and JWKS (pass --rotate to replace).');
}

const envFile = join(tmpdir(), `digipicks-convex-auth-${Date.now()}.env`);
writeFileSync(envFile, lines.join('\n'), 'utf8');

console.log('Setting Convex Auth environment variables on the linked deployment…');
console.log(`  SITE_URL=${siteUrl}`);
try {
  execSync(`npx convex env set --from-file ${JSON.stringify(envFile)} --force`, {
    stdio: 'inherit',
    cwd: repoRoot,
  });
} finally {
  unlinkSync(envFile);
}

if (rotate || !hasKeys) {
  console.log(
    'Restart `pnpm dev` (or `npx convex dev`), clear __convexAuth* in localStorage, then sign in again.',
  );
} else {
  console.log('Done. SITE_URL updated; existing sessions should keep working.');
}
