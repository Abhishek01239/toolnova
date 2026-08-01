import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile as write, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

import { evaluateIdea, mapToFactory, tendCatalog } from '../lib/ai-gardener.mjs';

const ctx = (ids) => ({
  existingNorm: new Set(ids.map((s) => s.replace(/-/g, ''))),
  existingTokens: ids.map((s) => new Set(s.split('-')))
});

const validIdea = {
  id: 'timestamp-converter',
  title: 'Timestamp Converter',
  category: 'Date & Time',
  keywords: ['unix timestamp', 'epoch converter', 'timestamp to date'],
  blurb: 'Convert Unix timestamps to readable dates and back, in seconds or milliseconds, with timezone-safe output.',
  why: 'developer staple'
};

test('evaluateIdea accepts a genuinely new useful idea', () => {
  assert.deepEqual(evaluateIdea(validIdea, ctx(['json-formatter', 'case-converter'])), []);
});

test('evaluateIdea rejects duplicates, near-dupes, banned terms and junk', () => {
  const context = ctx(['word-counter', 'json-formatter']);
  // exact dup
  assert.ok(evaluateIdea({ ...validIdea, id: 'word-counter' }, context).some((p) => p.includes('duplicate')));
  // normalized dup
  assert.ok(evaluateIdea({ ...validIdea, id: 'wordcounter' }, context).some((p) => p.includes('duplicate')));
  // near-dupe: {word,counter,tool} vs {word,counter} → Jaccard 0.667
  assert.ok(evaluateIdea({ ...validIdea, id: 'word-counter-tool' }, context).some((p) => p.includes('similar')));
  // banned
  assert.ok(evaluateIdea({ ...validIdea, id: 'casino-odds-master', blurb: 'Casino style odds for betting fun and profit.' }, context).some((p) => p.includes('blocked')));
  // structure
  assert.ok(evaluateIdea({ ...validIdea, id: 'Bad Id!' }, context).length > 0);
  assert.ok(evaluateIdea({ ...validIdea, keywords: ['only', 'two'] }, context).some((p) => p.includes('keywords')));
  assert.ok(evaluateIdea({ ...validIdea, blurb: 'Too short.' }, context).some((p) => p.includes('blurb')));
  assert.ok(evaluateIdea({ ...validIdea, category: 'Not A Category' }, context).some((p) => p.includes('category')));
  assert.ok(evaluateIdea(null, context).length > 0);
});

test('mapToFactory only claims unclaimed factory configurations', () => {
  const noTaken = () => false;
  const codecTaken = (factory, params) => factory === 'encoder-decoder' && params.codec === 'base64';

  const b64Idea = { id: 'base64-image-encoder', blurb: 'Encode data as Base64 text for embedding.', keywords: ['base64'] };
  assert.deepEqual(mapToFactory(b64Idea, noTaken), { factory: 'encoder-decoder', params: { title: 'Base64 Image Encoder', codec: 'base64' } });
  assert.equal(mapToFactory(b64Idea, codecTaken), null, 'falls back to custom when codec already claimed');

  // Ambiguous ids (two codec words) always go to the AI author, never a guess.
  const ambiguous = { id: 'base64-url-encoder', blurb: 'URL-safe Base64 encoder for tokens and links.', keywords: ['base64'] };
  assert.equal(mapToFactory(ambiguous, noTaken), null);

  const tempIdea = { id: 'kelvin-converter', blurb: 'Convert between Celsius, Fahrenheit and Kelvin quickly.', keywords: ['kelvin'] };
  assert.deepEqual(mapToFactory(tempIdea, noTaken), { factory: 'unit-converter', params: { title: 'Kelvin Converter', kind: 'temperature' } });

  const customIdea = { id: 'invoice-maker', blurb: 'Create printable invoices with line items and totals.', keywords: ['invoice'] };
  assert.equal(mapToFactory(customIdea, noTaken), null);
});

test('tendCatalog (mock) plants only valid, unique ideas and persists them', async () => {
  process.env.AI_PROVIDER = 'mock';
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'garden-'));
  const catalogPath = path.join(tmp, 'catalog.json');

  try {
    const catalog = [
      { id: 'word-counter', factory: 'custom', category: 'Text', keywords: ['word', 'counter'] },
      { id: 'base64-encoder-decoder', factory: 'encoder-decoder', category: 'Encoding', keywords: ['base64'], params: { title: 'B64', codec: 'base64' } }
    ];
    const tools = [{ id: 'word-counter' }];

    const { added, rejected } = await tendCatalog({
      site: { name: 'ToolNova' },
      catalog, tools, target: 5, persist: true, catalogPath
    });

    const addedIds = added.map((e) => e.id);
    assert.deepEqual(addedIds.sort(), ['css-clamp-calculator', 'markdown-table-builder', 'timestamp-converter'].sort());
    assert.ok(added.every((e) => e.factory === 'custom'));

    const rejectedIds = rejected.map((r) => r.id);
    assert.ok(rejectedIds.includes('word-counter'), 'exact dup rejected');
    assert.ok(rejectedIds.includes('word-counter-tool'), 'near-dupe rejected');
    assert.ok(rejectedIds.includes('casino-odds-master'), 'banned topic rejected');

    // Persisted file contains the new entries, exactly once each.
    const onDisk = JSON.parse(await readFile(catalogPath, 'utf8'));
    const counts = {};
    for (const e of onDisk) counts[e.id] = (counts[e.id] || 0) + 1;
    assert.equal(counts['timestamp-converter'], 1);
    assert.equal(onDisk.length, 5);
    assert.equal(catalog.length, 5, 'in-memory catalog updated in lockstep');

    // New entries satisfy the same structural rules the catalog test enforces.
    for (const e of added) {
      assert.match(e.id, /^[a-z0-9][a-z0-9-]{1,60}$/);
      assert.ok(e.keywords.length >= 3);
      assert.ok(e.blurb.length >= 30);
    }
  } finally {
    delete process.env.AI_PROVIDER;
    await rm(tmp, { recursive: true, force: true });
  }
});

test('tendCatalog without a provider is a clean no-op', async () => {
  process.env.AI_PROVIDER = 'none';
  const result = await tendCatalog({ site: { name: 'ToolNova' }, catalog: [], tools: [], target: 5 });
  assert.deepEqual(result.added, []);
  assert.equal(result.skipped, 'no-provider');
  delete process.env.AI_PROVIDER;
});
