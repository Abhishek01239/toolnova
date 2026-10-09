import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('search results are rendered without HTML parsing sinks', async () => {
  const source = await readFile(new URL('../public/assets/search.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\.innerHTML\s*=/i);
  assert.doesNotMatch(source, /\.outerHTML\s*=/i);
  assert.doesNotMatch(source, /insertAdjacentHTML/i);
  assert.match(source, /textContent\s*=/);
  assert.match(source, /replaceChildren\(/);
});

test('shared tool stats render user-derived values as text nodes', async () => {
  const source = await readFile(new URL('../lib/factories/helpers.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\.innerHTML\s*=/i);
  assert.doesNotMatch(source, /\.outerHTML\s*=/i);
  assert.match(source, /dt\.textContent\s*=/);
  assert.match(source, /dd\.textContent\s*=/);
  assert.match(source, /el\.replaceChildren\(\)/);
});

test('Vercel config includes baseline anti-XSS browser headers', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const headers = config.headers.flatMap((rule) => rule.headers || []);
  const get = (name) => headers.find((header) => header.key.toLowerCase() === name.toLowerCase())?.value || '';
  const csp = get('Content-Security-Policy');
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(get('X-Content-Type-Options'), 'nosniff');
  assert.equal(get('X-Frame-Options'), 'DENY');
});
