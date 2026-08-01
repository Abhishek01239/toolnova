// The backlog gardener — keeps the daily agent fed with fresh, unique,
// useful tool ideas so the pipeline never runs out of things to build.
//
// It asks an LLM for new catalog ideas, then applies STRICT deterministic
// filters before anything lands in data/catalog.json:
//   • structural: kebab id, 3+ keywords, real category, 30–220 char blurb
//   • uniqueness: exact id, normalized id (dashes stripped) AND
//     token-similarity (Jaccard > 0.6) against every live OR queued tool —
//     so "word-counter-tool" can never shadow "word-counter"
//   • safety: brand/adult/scam term blocklist
//   • factory mapping is collision-aware: an idea only maps to a factory
//     codec/kind/generator that no queued or live entry already uses
// Rejected ideas are logged with reasons; accepted ones are appended to the
// catalog (the single release queue). Providers: same as the AI author —
// groq when a key exists, mock for tests/dev, none = no-op.

import { CATEGORIES } from './categories.js';
import { UNITS } from './fns/units.mjs';
import { CODECS } from './factories/encoder-decoder.mjs';
import { GENERATORS } from './factories/random-generator.mjs';
import { callGroq, resolveProvider } from './ai-author.mjs';

const BANNED_TERMS = [
  'casino', 'bet', 'betting', 'gambl', 'lottery', 'xxx', 'porn', 'nude',
  'adult', 'viagra', 'onlyfans', 'forex', 'binary-option', 'crack', 'keygen',
  'warez', 'pirate', 'torrent'
];

const idNorm = (s) => String(s).toLowerCase().replace(/-/g, '');
const idTokens = (s) => new Set(String(s).toLowerCase().split('-').filter(Boolean));

function jaccard(a, b) {
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union ? inter / union : 0;
}

// Evaluate one proposed idea against the full registry context.
// Returns an array of problems; [] means the idea is acceptable.
export function evaluateIdea(idea, context) {
  const problems = [];
  const { existingNorm, existingTokens } = context;

  if (!idea || typeof idea !== 'object') return ['not an object'];
  const id = String(idea.id || '');
  if (!/^[a-z0-9][a-z0-9-]{2,38}$/.test(id)) problems.push(`bad id "${id}"`);
  if (existingNorm.has(idNorm(id))) problems.push('duplicate of an existing/queued tool (normalized)');
  for (const toks of existingTokens) {
    if (jaccard(idTokens(id), toks) > 0.6) {
      problems.push(`too similar to an existing tool (${[...toks].join('-')})`);
      break;
    }
  }
  const lowerAll = `${id} ${idea.title || ''} ${idea.blurb || ''}`.toLowerCase();
  const banned = BANNED_TERMS.find((t) => lowerAll.includes(t));
  if (banned) problems.push(`contains blocked term "${banned}"`);

  if (typeof idea.category !== 'string' || !CATEGORIES[idea.category]) {
    problems.push(`unknown category "${idea.category}"`);
  }
  if (idea.title !== undefined && (typeof idea.title !== 'string' || idea.title.length < 3 || idea.title.length > 70)) {
    problems.push('title must be 3–70 chars when present');
  }
  if (!Array.isArray(idea.keywords) || idea.keywords.length < 3) {
    problems.push('needs at least 3 keywords');
  } else {
    for (const k of idea.keywords) {
      if (typeof k !== 'string' || k.trim().length < 2 || k.length > 40) {
        problems.push(`bad keyword "${k}"`);
        break;
      }
    }
  }
  if (typeof idea.blurb !== 'string' || idea.blurb.trim().length < 30 || idea.blurb.length > 220) {
    problems.push(`blurb must be 30–220 chars (got ${idea.blurb ? idea.blurb.trim().length : 0})`);
  }
  return problems;
}

// Map an idea to a factory + params when it clearly fits one. `taken(factory,
// params)` must report whether a (live, queued or just-accepted) entry
// already claims that factory configuration — e.g. the base64 codec.
export function mapToFactory(idea, taken) {
  const text = `${idea.id} ${idea.blurb} ${(idea.keywords || []).join(' ')}`.toLowerCase();
  const title = idea.title || idea.id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const toks = new Set(String(idea.id).toLowerCase().split('-'));

  // Only map when the idea unambiguously names ONE factory configuration —
  // anything ambiguous goes to the AI author (custom) instead of mis-mapping.
  const codecMatches = Object.keys(CODECS).filter((c) => toks.has(c));
  if (codecMatches.length === 1 && !taken('encoder-decoder', { codec: codecMatches[0] })) {
    return { factory: 'encoder-decoder', params: { title, codec: codecMatches[0] } };
  }

  const tempMarked = /celsius|fahrenheit|kelvin/.test(text);
  // Note: temperature is special-cased in the units factory, not a UNITS key.
  const kindMatches = Object.keys(UNITS).filter((k) => toks.has(k));
  if (tempMarked && kindMatches.length === 0 && !taken('unit-converter', { kind: 'temperature' })) {
    return { factory: 'unit-converter', params: { title, kind: 'temperature' } };
  }
  if (kindMatches.length === 1 && !taken('unit-converter', { kind: kindMatches[0] })) {
    return { factory: 'unit-converter', params: { title, kind: kindMatches[0] } };
  }

  const randomMarks = [
    [/random number/, 'random-number'], [/dice/, 'dice'], [/coin (flip|toss)/, 'coin'],
    [/random (hex )?colou?r/, 'random-color'], [/random letter/, 'random-letter'],
    [/random date/, 'random-date'], [/yes.?or.?no/, 'yes-or-no']
  ];
  const randomMatches = randomMarks.filter(([re]) => re.test(text)).map(([, gen]) => gen);
  if (randomMatches.length === 1 && GENERATORS[randomMatches[0]] &&
      !taken('random-generator', { generator: randomMatches[0] })) {
    return { factory: 'random-generator', params: { title, generator: randomMatches[0] } };
  }
  return null; // → custom module (the AI author or a human will write it)
}

function buildGardenPrompt(site, catalogSample, target) {
  const categoryList = Object.keys(CATEGORIES).join(', ');
  const system = [
    'You are a product strategist for a free browser-based tools website.',
    'You respond with ONLY valid JSON of the exact shape {"ideas": [...]}. No commentary.'
  ].join(' ');
  const user = [
    `Propose ${target} NEW tool ideas for "${site.name}" — a website where every tool runs 100% client-side in the browser (no servers, no accounts, no external APIs).`,
    '',
    'Each idea object: {"id", "title", "category", "keywords", "blurb", "why"} with:',
    '  id: kebab-case, 3–39 chars, 2–4 words, unique',
    '  title: 3–70 chars, plain English (e.g. "Timestamp Converter")',
    `  category: exactly one of: ${categoryList}`,
    '  keywords: 3–6 lowercase search phrases people actually type into Google',
    '  blurb: 30–220 chars ending with a period — what the tool does and for whom',
    '  why: ≤ 12 words — the search-demand or usefulness rationale',
    '',
    'REQUIREMENTS:',
    '- Tools must be genuinely useful, evergreen and searchable (utilities, converters, calculators, formatters, generators, validators, checkers).',
    '- Implementable entirely with browser APIs and self-contained data (NO external API, NO login, NO AI inference, NO live exchange rates).',
    '- No trademarks or clones of branded products.',
    '- Spread ideas across at least 6 different categories.',
    '- DO NOT propose anything from this existing/queued list (nor trivial variants of them):',
    catalogSample.join(', '),
    '',
    'Respond with {"ideas": [...]} only.'
  ].join('\n');
  return { system, user };
}

// Deterministic mixer of valid/invalid proposals for tests and local runs.
export function mockGardenIdeas() {
  return JSON.stringify({
    ideas: [
      {
        id: 'timestamp-converter', title: 'Timestamp Converter', category: 'Date & Time',
        keywords: ['unix timestamp', 'epoch converter', 'timestamp to date', 'date to timestamp'],
        blurb: 'Convert Unix timestamps to human-readable dates and back, in seconds or milliseconds with timezone-safe output.',
        why: 'developers search epoch conversion constantly'
      },
      {
        id: 'markdown-table-builder', title: 'Markdown Table Builder', category: 'Markdown',
        keywords: ['markdown table generator', 'md table maker', 'table to markdown'],
        blurb: 'Build Markdown tables visually from pasted CSV or typed rows and columns, with alignment control and copy-ready output.',
        why: 'docs writers need quick tables daily'
      },
      {
        id: 'css-clamp-calculator', title: 'CSS Clamp Calculator', category: 'Design',
        keywords: ['css clamp generator', 'fluid typography', 'responsive font size'],
        blurb: 'Generate fluid CSS clamp() values for type and spacing from min/max sizes and viewport range, with live preview.',
        why: 'fluid type is a rising dev search'
      },
      { id: 'word-counter', title: 'Word Counting Tool', category: 'Text', keywords: ['same', 'as', 'existing'], blurb: 'Duplicate on purpose for filter tests.', why: 'x' },
      { id: 'word-counter-tool', title: 'Another Word Counter', category: 'Text', keywords: ['near', 'dupe', 'filter'], blurb: 'Near-duplicate of the live word counter for filter tests.', why: 'x' },
      { id: 'casino-odds-master', title: 'Casino Odds Master', category: 'Math', keywords: ['bad', 'idea', 'block'], blurb: 'Banned topic for the filter tests to catch reliably.', why: 'x' },
      { "id": 'Bad Slug!', title: 'Broken', category: 'Text' }
    ]
  });
}

export async function tendCatalog({ site, catalog, tools, target = 15, persist = null, catalogPath = null }) {
  const provider = resolveProvider();
  if (provider === 'none') return { added: [], rejected: [], skipped: 'no-provider' };

  const existingIds = new Set([...catalog.map((c) => c.id), ...tools.map((t) => t.id)]);
  const context = {
    existingNorm: new Set([...existingIds].map(idNorm)),
    existingTokens: [...existingIds].map(idTokens)
  };

  const sample = [...existingIds].slice(-70);
  const prompt = buildGardenPrompt(site, sample, target * 2);
  const raw = provider === 'mock' ? mockGardenIdeas() : await callGroq(prompt);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const fence = raw.match(/```(?:json)?\s*\n([\s\S]*?)```/);
    if (!fence) throw new Error('gardener response was not valid JSON');
    parsed = JSON.parse(fence[1]);
  }
  const ideas = Array.isArray(parsed.ideas) ? parsed.ideas : [];

  const added = [];
  const rejected = [];
  const takenParams = catalog.map((c) => ({ factory: c.factory, params: c.params || {} }));
  const taken = (factory, params) =>
    takenParams.some((tp) => tp.factory === factory && Object.entries(params).every(([k, v]) => tp.params[k] === v));

  for (const idea of ideas) {
    if (added.length >= target) break;
    const problems = evaluateIdea(idea, context);
    if (problems.length) {
      rejected.push({ id: idea && idea.id, problems });
      continue;
    }
    const mapped = mapToFactory(idea, taken);
    const entry = mapped
      ? {
          id: idea.id, factory: mapped.factory, category: idea.category,
          keywords: idea.keywords.map((k) => k.trim().toLowerCase()), blurb: idea.blurb.trim(),
          params: mapped.params
        }
      : {
          id: idea.id, factory: 'custom', category: idea.category,
          keywords: idea.keywords.map((k) => k.trim().toLowerCase()), blurb: idea.blurb.trim(),
          why: String(idea.why || '').slice(0, 120) || undefined
        };
    added.push(entry);
    // Register so later proposals in the same batch can't collide with it.
    context.existingNorm.add(idNorm(entry.id));
    context.existingTokens.push(idTokens(entry.id));
    if (mapped) takenParams.push({ factory: mapped.factory, params: mapped.params });
  }

  catalog.push(...added);

  if (persist && added.length && catalogPath) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  }

  return { added, rejected, provider };
}
