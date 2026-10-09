import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('browser runtime clears known legacy auth tokens without storing new credentials', async () => {
  const core = await readFile(path.join(ROOT, 'public/assets/core.js'), 'utf8');
  for (const key of ['access_token', 'auth_token', 'authToken', 'refresh_token', 'id_token']) {
    assert.ok(core.includes("'" + key + "'"), 'missing cleanup key ' + key);
  }
  const writes = [...core.matchAll(/localStorage\.setItem\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  assert.deepEqual(writes, ['tn-theme'], 'only the non-sensitive theme preference may be persisted');
});

test('production verification rejects source maps and sourceMappingURL references', async () => {
  const verifier = await readFile(path.join(ROOT, 'scripts/verify.mjs'), 'utf8');
  assert.ok(verifier.includes("const sourceMaps = files.filter((f) => f.endsWith('.map'))"));
  assert.match(verifier, /sourceMappingURL/);
});

test('CORS is not wildcarded and security headers remain configured', async () => {
  const config = JSON.parse(await readFile(path.join(ROOT, 'vercel.json'), 'utf8'));
  const rules = config.headers || [];
  const apiRule = rules.find((rule) => rule.source === '/api/(.*)');
  assert.ok(apiRule, 'expected the narrowly scoped API CORS rule');
  const headers = Object.fromEntries((apiRule.headers || []).map((h) => [h.key.toLowerCase(), h.value]));
  assert.equal(headers['access-control-allow-origin'], 'https://toolnova-seven.vercel.app');
  assert.notEqual(headers['access-control-allow-origin'], '*');
  assert.equal(headers['access-control-allow-credentials'], undefined);
  const allHeaders = rules.flatMap((rule) => rule.headers || []);
  for (const key of ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options']) {
    assert.ok(allHeaders.some((header) => header.key.toLowerCase() === key.toLowerCase()), 'missing security header: ' + key);
  }
});

test('security documentation distinguishes live controls from future backend requirements', async () => {
  const security = await readFile(path.join(ROOT, 'SECURITY.md'), 'utf8');
  for (const concern of ['SQL injection', 'CSRF', 'File upload validation', 'BOLA/IDOR', 'Rate limiting',
    'API secrets', 'Password hashing', 'Multi-factor authentication', 'CORS', 'Auth tokens in localStorage',
    'Server-side permissions', 'Webhook signatures', 'SSRF', 'Exposed source maps', 'Sensitive data in logs',
    'Vulnerable dependencies']) {
    assert.ok(security.toLowerCase().includes(concern.toLowerCase()), 'missing security checklist item: ' + concern);
  }
});
