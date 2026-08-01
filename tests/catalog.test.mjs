import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await readFile(path.join(ROOT, 'data', 'catalog.json'), 'utf8'));
const tools = JSON.parse(await readFile(path.join(ROOT, 'data', 'tools.json'), 'utf8'));

const KNOWN_FACTORIES = new Set(['custom', 'text-transform', 'encoder-decoder', 'random-generator', 'unit-converter']);

test('catalog ids are unique and well-formed', () => {
  const ids = new Set();
  for (const item of catalog) {
    assert.match(item.id, /^[a-z0-9][a-z0-9-]{1,60}$/, `bad id ${item.id}`);
    assert.ok(!ids.has(item.id), `duplicate catalog id ${item.id}`);
    ids.add(item.id);
    assert.ok(KNOWN_FACTORIES.has(item.factory), `${item.id}: unknown factory "${item.factory}"`);
    assert.ok(typeof item.category === 'string' && item.category.length > 1, `${item.id}: missing category`);
    assert.ok(Array.isArray(item.keywords) && item.keywords.length >= 2, `${item.id}: needs ≥2 keywords`);
    if (item.factory !== 'custom') {
      assert.ok(item.params && typeof item.params === 'object', `${item.id}: factory entries need params`);
      assert.ok(item.params.title, `${item.id}: factory entries need params.title`);
      assert.ok(typeof item.blurb === 'string' && item.blurb.length >= 30, `${item.id}: blurb must be ≥30 chars`);
    }
  }
  assert.ok(catalog.length >= 100, `catalog should hold 100+ ideas, has ${catalog.length}`);
});

test('tools.json entries come from the catalog (no orphans, no drift)', () => {
  const catalogIds = new Set(catalog.map((c) => c.id));
  const seen = new Set();
  for (const tool of tools) {
    assert.ok(catalogIds.has(tool.id), `tools.json entry "${tool.id}" is not in the catalog`);
    assert.ok(!seen.has(tool.id), `tools.json has duplicate id "${tool.id}"`);
    seen.add(tool.id);
  }
});

test('every live tool has a client script on disk', async () => {
  for (const tool of tools) {
    const jsPath = path.join(ROOT, 'tools', `${tool.id}.js`);
    await assert.doesNotReject(() => access(jsPath), `${tool.id}.js missing`);
  }
});

test('the daily backlog always has factory candidates ready', () => {
  const live = new Set(tools.map((t) => t.id));
  const factoryBacklog = catalog.filter((c) => !live.has(c.id) && c.factory !== 'custom');
  assert.ok(factoryBacklog.length >= 7, 'keep at least a week of guaranteed factory tools in the backlog');
});
