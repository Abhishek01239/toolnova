#!/usr/bin/env node
// The daily generator. Picks the next catalog candidate that isn't live yet,
// generates it (factory or custom module), then runs the full quality gate
// (unit tests → build → verify). Only a fully green tool gets committed to
// tools.json; failures roll back and the next candidate is tried, so the
// pipeline "never stops until one new working tool is added".

import { readFile, writeFile, access, rm, mkdir, rename } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateEntry, normalizeEntry } from '../lib/registry.js';
import { finalizeEntry } from '../lib/factories/helpers.mjs';
import { rankWithAI } from '../lib/ai.mjs';
import { authorModule, resolveProvider } from '../lib/ai-author.mjs';
import { tendCatalog } from '../lib/ai-gardener.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOOLS_JSON = path.join(ROOT, 'data', 'tools.json');
const CATALOG_JSON = path.join(ROOT, 'data', 'catalog.json');
const SITE_JSON = path.join(ROOT, 'data', 'site.json');
const TOOLS_DIR = path.join(ROOT, 'tools');
const CUSTOM_DIR = path.join(ROOT, 'scripts', 'generators', 'custom');

// How many model calls one run may spend authoring modules (each candidate
// retries once, so 4 ≈ up to 2 AI-authored tools/candidates per day).
let aiCallsRemaining = Math.max(0, parseInt(process.env.AI_BUDGET || '4', 10) || 4);
// Set when the provider answers 429 with a reset window too long to wait for;
// further AI attempts in this run would fail identically.
let rateLimitAborted = false;
let skippedAIReported = false;

const FACTORY_LOADERS = {
  'text-transform': () => import('../lib/factories/text-transform.mjs'),
  'encoder-decoder': () => import('../lib/factories/encoder-decoder.mjs'),
  'random-generator': () => import('../lib/factories/random-generator.mjs'),
  'unit-converter': () => import('../lib/factories/unit-converter.mjs')
};

function parseArgs() {
  const args = { count: 1, dryRun: false, noGate: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--no-gate') args.noGate = true;
    else if (arg.startsWith('--count=')) args.count = Math.max(1, parseInt(arg.split('=')[1], 10) || 1);
  }
  if (process.env.SEED_COUNT) args.count = Math.max(1, parseInt(process.env.SEED_COUNT, 10) || 1);
  return args;
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// tools.json must never be unparseable: missing/empty/corrupt → start empty.
async function readTools() {
  try {
    const raw = await readFile(TOOLS_JSON, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    return parsed;
  } catch (err) {
    console.warn(`⚠ data/tools.json unreadable (${err.message}); starting from an empty registry.`);
    return [];
  }
}

// Compiles candidate module source exactly where the real module will live,
// so its relative imports resolve — then generates, validates and self-tests
// it before promoting the temp file to the real module path.
function makeModuleInstaller(catalogItem, ctx, modulePath) {
  return async (code) => {
    const tmpPath = path.join(CUSTOM_DIR, `.tmp-${catalogItem.id}-${Date.now()}.mjs`);
    await writeFile(tmpPath, code, 'utf8');
    try {
      const mod = await import(pathToFileURL(tmpPath).href + '?v=' + Date.now());
      if (typeof mod.default !== 'function') throw new Error('module must default-export a generate function');
      if (typeof mod.selfTest !== 'function') throw new Error('module must export a selfTest() function');
      const result = await mod.default(catalogItem, ctx);
      if (!result || !result.entry || !result.js) throw new Error('generate() must return { entry, js }');
      const entry = normalizeEntry(finalizeEntry(result.entry, catalogItem, ctx));
      if (entry.id !== catalogItem.id) throw new Error(`entry.id "${entry.id}" must equal catalog id "${catalogItem.id}"`);
      await mod.selfTest();
      await rename(tmpPath, modulePath);
      return { entry, js: result.js };
    } finally {
      await rm(tmpPath, { force: true });
    }
  };
}

async function generateTool(catalogItem, ctx, allowAuthor) {
  if (catalogItem.factory === 'custom') {
    const modulePath = path.join(CUSTOM_DIR, `${catalogItem.id}.mjs`);
    let authored = false;
    if (!(await exists(modulePath))) {
      if (!allowAuthor || resolveProvider() === 'none') {
        throw new Error('custom module not written yet (add scripts/generators/custom/' + catalogItem.id + '.mjs' +
          (resolveProvider() === 'none' ? ' — or set GROQ_API_KEY so the AI author writes it)' : ')'));
      }
      if (aiCallsRemaining <= 0) throw new Error('AI authoring budget for this run is exhausted');
      aiCallsRemaining--;
      console.log(`✎ Asking the AI author (${resolveProvider()}) to write scripts/generators/custom/${catalogItem.id}.mjs…`);
      const outcome = await authorModule(catalogItem, ctx.site, makeModuleInstaller(catalogItem, ctx, modulePath));
      if (!outcome.ok) throw new Error(`AI authoring failed: ${outcome.error || outcome.reason}`);
      authored = true;
      console.log(`✎ AI author produced a valid module for "${catalogItem.id}" on attempt ${outcome.attempts}.`);
      return { entry: outcome.entry, js: outcome.js, modulePath, authored };
    }
    const mod = await import(pathToFileURL(modulePath).href + '?v=' + Date.now());
    if (typeof mod.default !== 'function') throw new Error('custom module must default-export a generate function');
    const result = await mod.default(catalogItem, ctx);
    return { entry: finalizeEntry(result.entry, catalogItem, ctx), js: result.js, modulePath, authored };
  }
  const loader = FACTORY_LOADERS[catalogItem.factory];
  if (!loader) throw new Error(`unknown factory "${catalogItem.factory}"`);
  const factory = await loader();
  const result = factory.generate(catalogItem, ctx);
  return { entry: finalizeEntry(result.entry, catalogItem, ctx), js: result.js, modulePath: null, authored: false };
}

function runQualityGate(root) {
  execFileSync(process.argv[0], ['--test'], { cwd: root, stdio: 'inherit' });
  execFileSync(process.argv[0], ['scripts/build.mjs'], { cwd: root, stdio: 'inherit' });
  execFileSync(process.argv[0], ['scripts/verify.mjs'], { cwd: root, stdio: 'inherit' });
}

async function main() {
  const args = parseArgs();
  const site = JSON.parse(await readFile(SITE_JSON, 'utf8'));
  const catalog = JSON.parse(await readFile(CATALOG_JSON, 'utf8'));
  const tools = await readTools();
  const ctx = { site, today: new Date().toISOString().slice(0, 10) };
  await mkdir(TOOLS_DIR, { recursive: true });
  await mkdir(CUSTOM_DIR, { recursive: true });

  const live = new Set(tools.map((t) => t.id));
  const addedIds = [];

  // Self-replenishing backlog: if the queue is running low and an AI provider
  // is available, the gardener plants fresh unique ideas before today's pick.
  const MIN_BACKLOG = Math.max(3, parseInt(process.env.GARDEN_MIN || '14', 10) || 14);
  const backlogSize = catalog.filter((c) => !live.has(c.id)).length;
  if (!args.dryRun && backlogSize < MIN_BACKLOG && resolveProvider() !== 'none') {
    console.log(`🌱 Backlog low (${backlogSize} ideas left); the gardener is planting fresh ones…`);
    try {
      const before = catalog.length;
      await tendCatalog({ site, catalog, tools, target: 15, persist: true, catalogPath: CATALOG_JSON });
      console.log(`🌱 Gardener planted ${catalog.length - before} new ideas.`);
    } catch (err) {
      console.warn(`🌱 Gardener failed (non-fatal, catalog untouched): ${String(err.message).split('\n')[0]}`);
    }
  }

  for (let round = 0; round < args.count; round++) {
    let candidates = catalog.filter((c) => !live.has(c.id));
    if (!candidates.length) {
      console.error('🚨 The catalog backlog is exhausted — add more entries to data/catalog.json!');
      if (addedIds.length === 0) process.exit(1);
      break;
    }

    const ranked = await rankWithAI(candidates, site);
    if (ranked) candidates = ranked;
    console.log(`\n▶ ${candidates.length} candidates in the backlog; trying in order…`);

    // If no AI provider is configured at all and every remaining candidate
    // needs the AI author, there is nothing this run can do — exit cleanly
    // instead of failing 65 times with "custom module not written yet".
    if (resolveProvider() === 'none' && candidates.every((c) => c.factory === 'custom')) {
      console.warn('🤖 No AI provider configured (no API key) and every backlog candidate needs AI authoring — nothing to add this run.');
      if (addedIds.length === 0) {
        console.log('\nADDED_TOOLS=none');
        process.exit(0);
      }
      break;
    }

    let addedThisRound = false;
    for (const candidate of candidates) {
      // Budget spent, or the provider is rate-limited with a long reset
      // window: skip AI-dependent candidates (every one would fail the same
      // way), but keep trying deterministic factory candidates — they cost
      // nothing and can still succeed.
      if (candidate.factory === 'custom' && (aiCallsRemaining <= 0 || rateLimitAborted)) {
        if (!skippedAIReported) {
          const why = rateLimitAborted
            ? 'AI provider is rate-limited with a long reset window'
            : 'AI authoring budget for this run is exhausted';
          console.warn(`⏭️ Skipping AI-authored candidates — ${why}.`);
          skippedAIReported = true;
        }
        continue;
      }
      let wroteJs = false;
      let pushedEntry = false;
      let authoredModulePath = null;
      try {
        const { entry, js, modulePath, authored } = await generateTool(candidate, ctx, !args.dryRun);
        if (authored) authoredModulePath = modulePath;
        if (entry.id !== candidate.id) throw new Error(`entry id "${entry.id}" != catalog id "${candidate.id}"`);
        if (!js || js.length < 200) throw new Error('generated client script looks empty');
        const finalEntry = normalizeEntry(entry);
        validateEntry(finalEntry);

        if (args.dryRun) {
          console.log(`✓ [dry-run] would add: ${finalEntry.id} — ${finalEntry.title}`);
          addedThisRound = true;
          break;
        }

        await writeFile(path.join(TOOLS_DIR, `${finalEntry.id}.js`), js, 'utf8');
        wroteJs = true;
        tools.push(finalEntry);
        pushedEntry = true;
        await writeFile(TOOLS_JSON, JSON.stringify(tools, null, 2) + '\n', 'utf8');

        if (!args.noGate) {
          console.log(`  …running quality gate (tests → build → verify) for "${finalEntry.id}"`);
          runQualityGate(ROOT);
        }

        live.add(finalEntry.id);
        addedIds.push(finalEntry.id);
        addedThisRound = true;
        console.log(`✅ Added "${finalEntry.title}" (${finalEntry.id})${authoredModulePath ? ' 🤖 module written by the AI author' : ''} — ${tools.length} tools live.`);
        break;
      } catch (err) {
        console.warn(`✗ candidate "${candidate.id}" failed: ${String(err.message).split('\n')[0]}`);
        // Roll back every partial write so the repo never contains a broken tool.
        if (pushedEntry) tools.pop();
        await writeFile(TOOLS_JSON, JSON.stringify(tools, null, 2) + '\n', 'utf8');
        if (wroteJs) await rm(path.join(TOOLS_DIR, `${candidate.id}.js`), { force: true });
        if (authoredModulePath) await rm(authoredModulePath, { force: true });
        // Wait a short moment before moving to the next candidate to avoid hammering APIs
        const errMsg = String(err.message);
        const isRateLimit = errMsg.includes('Rate Limit') || errMsg.includes('429');
        if (errMsg.includes('Aborting retries') || errMsg.includes('reset time is too long')) {
          rateLimitAborted = true;
        }
        const nextDelay = isRateLimit ? 60000 : 3000;
        if (isRateLimit) {
          console.log(`⏳ Rate limit hit. Waiting 60s for reset before trying the next candidate…`);
        }
        await new Promise((resolve) => setTimeout(resolve, nextDelay));
      }
    }

    if (!addedThisRound) {
      console.error('\n🚨 No candidate could be generated successfully this run.');
      if (addedIds.length === 0) {
        // An AI-only outage (rate limit, exhausted budget, no provider) is an
        // environmental condition, not a pipeline bug: end the run green so
        // the schedule stays healthy and the next run simply retries.
        if (skippedAIReported || rateLimitAborted) {
          console.log('ℹ️  Cause: AI provider unavailable or rate-limited — no tools generated; exiting 0 (retry next run).');
          console.log('\nADDED_TOOLS=none');
          process.exit(0);
        }
        process.exit(1);
      }
      break;
    }
  }

  if (args.dryRun) process.exit(0);
  const remaining = catalog.length - live.size;
  console.log(`\nADDED_TOOLS=${addedIds.join(',') || 'none'}`);
  console.log(`Summary: ${tools.length} tools live, ${remaining} ideas left in the backlog.`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
