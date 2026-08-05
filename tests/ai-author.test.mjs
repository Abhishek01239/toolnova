import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { extractCode, staticScan, resolveProvider, authorModule } from '../lib/ai-author.mjs';
import { validateEntry, normalizeEntry } from '../lib/registry.js';
import { finalizeEntry } from '../lib/factories/helpers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CUSTOM_DIR = path.join(ROOT, 'scripts', 'generators', 'custom');

const ctx = {
  today: '2026-07-31',
  site: { name: 'ToolNova', url: 'https://toolnova.vercel.app', ogImage: '/assets/og.jpg', locale: 'en_US', themeColor: '#4f46e5' }
};

const mockItem = {
  id: 'mock-character-analyzer',
  factory: 'custom',
  category: 'Text',
  keywords: ['character analyzer', 'letter count', 'text analysis', 'mocked tool'],
  blurb: 'Analyzes any text into live letter, digit, space and symbol counts for the authoring-path test.'
};

// ---------- extraction ----------
test('extractCode handles JSON, fenced and raw responses', () => {
  const module = 'export default function generate() {}\nexport async function selfTest() {}';
  assert.equal(extractCode(JSON.stringify({ code: module })), module);
  assert.equal(extractCode('Here is your module:\n```javascript\n' + module + '\n```'), module);
  assert.equal(extractCode(module), module);
  assert.equal(extractCode('{"code":"too short"}'), null);
  assert.equal(extractCode('no code here at all'), null);
  assert.equal(extractCode(null), null);
});

// ---------- static scan ----------
test('staticScan accepts a clean module and rejects dangerous ones', () => {
  const clean = `import { frame } from '../../../lib/factories/helpers.mjs';
export default function generate(catalogItem, ctx) { return { entry: {}, js: frame('status("ok")') }; }
export async function selfTest() { if (1 === 2) throw new Error('x'); }
// ${'x'.repeat(400)}`;
  assert.deepEqual(staticScan(clean), []);

  const banned = [
    'const data = await fetch("https://evil.example")',
    'eval("alert(1)")',
    'const x = new Function("return 1")',
    'const fs = require("fs")',
    'await import("./other.mjs")',
    'console.log(process.env.SECRET)',
    '// TODO: finish later',
    'el.innerHTML = userInput'
  ];
  for (const snippet of banned) {
    const code = clean.replace("status(\"ok\")", "status(\"ok\");" + snippet);
    assert.ok(staticScan(code).length > 0, `should reject: ${snippet}`);
  }
  assert.ok(staticScan('export default 1').length > 0, 'missing generate/selfTest');
});

// ---------- provider resolution ----------
test('resolveProvider honors env configuration', () => {
  const groqKey = process.env.GROQ_API_KEY;
  const opencodeKey = process.env.OPENCODE_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.OPENCODE_API_KEY;
  process.env.AI_PROVIDER = 'auto';
  assert.equal(resolveProvider(), 'none');
  process.env.AI_PROVIDER = 'mock';
  assert.equal(resolveProvider(), 'mock');
  process.env.AI_PROVIDER = 'none';
  assert.equal(resolveProvider(), 'none');
  process.env.GROQ_API_KEY = 'test-key';
  process.env.AI_PROVIDER = 'auto';
  assert.equal(resolveProvider(), 'groq');
  process.env.AI_PROVIDER = 'groq';
  assert.equal(resolveProvider(), 'groq');

  delete process.env.GROQ_API_KEY;
  process.env.OPENCODE_API_KEY = 'test-key';
  process.env.AI_PROVIDER = 'auto';
  assert.equal(resolveProvider(), 'opencode-zen');
  process.env.AI_PROVIDER = 'opencode-zen';
  assert.equal(resolveProvider(), 'opencode-zen');

  if (groqKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = groqKey;
  if (opencodeKey === undefined) delete process.env.OPENCODE_API_KEY;
  else process.env.OPENCODE_API_KEY = opencodeKey;
  delete process.env.AI_PROVIDER;
});

// ---------- end-to-end: mock provider authors a real, valid module ----------
test('authorModule (mock) produces a module that passes the full contract', async () => {
  process.env.AI_PROVIDER = 'mock';
  const modulePath = path.join(CUSTOM_DIR, `${mockItem.id}.mjs`);

  const result = await authorModule(mockItem, ctx.site, async (code) => {
    // This is the same compile-validate-selftest the daily script performs.
    const tmpPath = path.join(CUSTOM_DIR, `.tmp-${mockItem.id}.mjs`);
    await writeFile(tmpPath, code, 'utf8');
    try {
      const mod = await import(pathToFileURL(tmpPath).href);
      assert.equal(typeof mod.default, 'function');
      assert.equal(typeof mod.selfTest, 'function');
      const generated = await mod.default(mockItem, ctx);
      const entry = normalizeEntry(finalizeEntry(generated.entry, mockItem, ctx));
      validateEntry(entry); // the real registry contract
      await mod.selfTest(); // the mocked logic assertions must pass
      return { entry, js: generated.js };
    } finally {
      await rm(tmpPath, { force: true });
    }
  });

  try {
    assert.equal(result.ok, true, result.error || 'authoring failed');
    assert.equal(result.entry.id, mockItem.id);
    assert.equal(result.entry.category, 'Text');
    assert.ok(result.js.length > 400);
    assert.ok(result.js.includes('analyzeText'));
    new Function(result.js); // client script parses
  } finally {
    await rm(modulePath, { force: true }); // mock results must never persist
    delete process.env.AI_PROVIDER;
  }
});

test('authorModule returns no-provider when disabled', async () => {
  process.env.AI_PROVIDER = 'none';
  const result = await authorModule(mockItem, ctx.site, async () => {
    throw new Error('should never be called');
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'no-provider');
  delete process.env.AI_PROVIDER;
});

test('authorModule retries with feedback after a createModule failure', async () => {
  process.env.AI_PROVIDER = 'mock';
  let calls = 0;
  const result = await authorModule(mockItem, ctx.site, async () => {
    calls++;
    if (calls === 1) throw new Error('first attempt exploded');
    // second attempt still runs the real validation
    return { entry: null, js: null };
  });
  assert.equal(calls, 2, 'retried once with feedback');
  assert.equal(result.ok, true);
  delete process.env.AI_PROVIDER;
});
