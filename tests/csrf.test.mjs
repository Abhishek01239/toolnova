import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

test('static site has no server-side API or function directories for CSRF to target', async () => {
  for (const rel of ['api', 'pages/api', 'app/api', 'functions', 'api-functions']) {
    assert.equal(await exists(path.join(ROOT, rel)), false, `unexpected server endpoint directory: ${rel}`);
  }
  const vercel = JSON.parse(await readFile(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.equal(vercel.functions, undefined, 'unexpected Vercel function configuration');
});

test('site forms remain read-only GET search forms, not state-changing POST forms', async () => {
  const sourceDirs = ['pages', 'components'];
  for (const dir of sourceDirs) {
    const files = (await readdir(path.join(ROOT, dir), { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith('.js'));
    for (const file of files) {
      const source = await readFile(path.join(ROOT, dir, file.name), 'utf8');
      assert.doesNotMatch(source, /<form\b[^>]*\bmethod\s*=\s*["']post["']/i,
        `${dir}/${file.name} introduces a POST form; add real CSRF controls if it changes server state`);
    }
  }
});

test('Vercel does not enable permissive cross-origin resource sharing', async () => {
  const vercel = JSON.parse(await readFile(path.join(ROOT, 'vercel.json'), 'utf8'));
  const headers = vercel.headers.flatMap((rule) => rule.headers || []);
  assert.equal(headers.some((header) => header.key.toLowerCase() === 'access-control-allow-origin' && header.value === '*'), false,
    'do not allow arbitrary origins to access site resources');
});
