import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function exists(relativePath) {
  try {
    await access(path.join(ROOT, relativePath));
    return true;
  } catch {
    return false;
  }
}

test('static ToolNova has no server-side object endpoints that can expose cross-user records', async () => {
  for (const relativePath of [
    'api',
    'pages/api',
    'app/api',
    'src/app/api',
    'src/pages/api',
    'functions',
    'api-functions'
  ]) {
    assert.equal(await exists(relativePath), false,
      'New server endpoint directory detected: ' + relativePath +
      '. Add authenticated, per-object authorization tests before shipping it.');
  }

  const config = JSON.parse(await readFile(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.equal(config.functions, undefined,
    'Vercel server functions detected. Review every object lookup and mutation for ownership checks.');
});

test('static ToolNova does not introduce server-side persistence dependencies without an authorization review', async () => {
  const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
  const dependencies = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  };
  const serverDataPackages = /^(?:@supabase\/supabase-js|firebase-admin|mongoose|mongodb|pg|mysql2|prisma|@prisma\/client|drizzle-orm|@neondatabase\/serverless)$/;
  const found = Object.keys(dependencies).filter((name) => serverDataPackages.test(name));
  assert.deepEqual(found, [],
    'Server data/auth dependencies added (' + found.join(', ') +
    '). Add object-level authorization tests and verify every record is scoped to the authenticated principal.');
});
