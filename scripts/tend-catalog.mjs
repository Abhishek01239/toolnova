#!/usr/bin/env node
// The gardener CLI — plants fresh, unique, useful tool ideas into
// data/catalog.json, then proves the whole site still builds and verifies.
// Runs weekly via garden-catalog.yml and on demand:
//   node scripts/tend-catalog.mjs              (defaults to 15 ideas)
//   node scripts/tend-catalog.mjs --target=30

import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tendCatalog } from '../lib/ai-gardener.mjs';
import { resolveProvider } from '../lib/ai-author.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_JSON = path.join(ROOT, 'data', 'catalog.json');

function targetFromArgs() {
  const arg = process.argv.slice(2).find((a) => a.startsWith('--target='));
  const env = process.env.GARDEN_TARGET;
  return Math.max(1, parseInt((arg && arg.split('=')[1]) || env || '15', 10) || 15);
}

async function main() {
  const site = JSON.parse(await readFile(path.join(ROOT, 'data', 'site.json'), 'utf8'));
  const catalog = JSON.parse(await readFile(CATALOG_JSON, 'utf8'));
  const tools = JSON.parse(await readFile(path.join(ROOT, 'data', 'tools.json'), 'utf8'));

  if (resolveProvider() === 'none') {
    console.log('GARDEN_ADDED=none');
    console.log('No AI provider configured (set GROQ_API_KEY, or AI_PROVIDER=mock for a local dry run) — catalog untouched.');
    return;
  }

  console.log(`🌱 Gardening the catalog (provider: ${resolveProvider()}, target: ${targetFromArgs()})…`);
  const { added, rejected } = await tendCatalog({
    site, catalog, tools,
    target: targetFromArgs(),
    persist: true,
    catalogPath: CATALOG_JSON
  });

  for (const entry of added) {
    console.log(`  + ${entry.id} [${entry.factory}${entry.params ? '/' + Object.values(entry.params).pop() : ''}] — ${entry.blurb.slice(0, 72)}…`);
  }
  for (const r of rejected) {
    console.log(`  – rejected ${r.id ?? '(no id)'}: ${r.problems[0]}`);
  }

  if (added.length) {
    // Prove the enlarged catalog still passes the whole quality gate.
    execFileSync(process.argv[0], ['--test', 'tests/'], { cwd: ROOT, stdio: 'inherit' });
    execFileSync(process.argv[0], ['scripts/build.mjs'], { cwd: ROOT, stdio: 'inherit' });
    execFileSync(process.argv[0], ['scripts/verify.mjs'], { cwd: ROOT, stdio: 'inherit' });
  }

  console.log(`\nGARDEN_ADDED=${added.map((e) => e.id).join(',') || 'none'}`);
  console.log(`Summary: planted ${added.length} new ideas, rejected ${rejected.length} (duplicates/low quality), catalog now ${catalog.length} entries.`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
