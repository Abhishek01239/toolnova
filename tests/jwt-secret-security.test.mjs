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

test('JWT documentation forbids exposing signing secrets to browser code', async () => {
  const readme = await readFile(path.join(ROOT, 'README.md'), 'utf8');
  const section = readme.split('## Security: JWT signing secrets')[1]?.split(/^## /m)[0] || '';
  assert.match(section, /static, browser-only/i);
  assert.match(section, /Never put them in Git/i);
  assert.match(section, /client-side environment variables/i);
  assert.match(section, /cryptographically secure random/i);
  assert.match(section, /Pin the accepted algorithm/i);
  assert.match(section, /invalid signatures/i);
});

test('JWT/auth endpoints trigger a review before introducing signing secrets', async () => {
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
      'Server endpoint directory detected: ' + relativePath +
      '. Review JWT secret storage, verification, and auth tests before shipping it.');
  }

  const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
  const dependencies = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  };
  const authPackages = /^(?:jsonwebtoken|jose|@auth\/core|next-auth|passport|passport-jwt)$/;
  const found = Object.keys(dependencies).filter((name) => authPackages.test(name));
  assert.deepEqual(found, [],
    'JWT/auth dependencies detected (' + found.join(', ') +
    '). Review secret handling and add implementation-level security tests.');
});
