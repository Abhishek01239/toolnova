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

test('new server endpoints require a rate-limiting review', async () => {
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
      '. Implement server-enforced rate limiting and endpoint-level tests before shipping it.');
  }

  const config = JSON.parse(await readFile(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.equal(config.functions, undefined,
    'Vercel server functions detected. Review each function for rate limiting before shipping.');
});

test('rate-limit guidance documents real enforcement and overload responses', async () => {
  const readme = await readFile(path.join(ROOT, 'README.md'), 'utf8');
  const section = readme.split('## Security: Rate limiting')[1]?.split(/^## /m)[0] || '';
  assert.match(section, /server-enforced/i);
  assert.match(section, /HTTP 429/i);
  assert.match(section, /Retry-After/i);
  assert.match(section, /distributed counter/i);
  assert.match(section, /not a live traffic limiter/i);
});
