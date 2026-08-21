// The AI author inside the daily agent.
//
// Given a catalog item (a custom tool idea with no module yet), this asks a
// free-tier LLM (Groq by default) to write the complete custom module for
// scripts/generators/custom/<id>.mjs. The AI only ever PROPOSES code:
//   1. output must extract to a single ESM module
//   2. static safety scan (no network, no eval, no dynamic import, no TODOs…)
//   3. the caller's `createModule` hook compiles it, runs the module's own
//      selfTest(), and validates the produced entry against lib/registry.js
//   4. on any failure the model retries ONCE with the exact error message
//   5. afterwards the normal quality gate (tests → build → verify) still runs
// If anything fails, the candidate is skipped and the daily run falls back
// to vetted factory tools — the pipeline can never be broken by the model.
//
// Providers:
//   AI_PROVIDER=auto  → groq when GROQ_API_KEY is set, else none (default)
//   AI_PROVIDER=groq  → force Groq (requires GROQ_API_KEY)
//   AI_PROVIDER=mock  → deterministic built-in author for tests/dev (no key)
//   AI_PROVIDER=none  → disable authoring entirely

import { getAIConfig, isModelNotFound } from './ai.mjs';

// Things the AI's module must never contain. `placeholder` is intentionally
// NOT here (it is a legitimate control property).
const BANNED_TOKENS = [
  'TODO', 'FIXME', 'XXX', 'HACK',
  'eval(', 'new Function(', 'fetch(', 'XMLHttpRequest', 'WebSocket',
  'require(', 'import(', 'process.env', 'child_process',
  'readFileSync', 'writeFileSync', 'alert(', 'confirm(', 'prompt(',
  'document.write', 'innerHTML ='
];

export function resolveProvider() {
  const config = getAIConfig();
  return config.provider;
}

export function staticScan(code) {
  const problems = [];
  if (typeof code !== 'string' || code.length < 400) problems.push('module is implausibly short');
  for (const token of BANNED_TOKENS) {
    if (code.includes(token)) problems.push(`forbidden token "${token}"`);
  }
  if (!/export\s+default\s+function\s+generate/.test(code)) {
    problems.push('missing "export default function generate"');
  }
  if (!/export\s+(async\s+)?function\s+selfTest/.test(code)) {
    problems.push('missing exported selfTest()');
  }
  for (const line of code.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('import ') && !trimmed.includes('lib/factories/helpers.mjs')) {
      problems.push(`only the helpers import is allowed, found: "${trimmed}"`);
    }
  }
  if (code.includes('`')) problems.push('client code must not contain template literals/backticks');
  return problems;
}

// The LLM answers JSON {"code": "..."}, but be liberal in what we accept:
// fenced code blocks and raw module text also extract cleanly.
export function extractCode(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.code === 'string' && parsed.code.length > 40) return parsed.code;
  } catch { /* not pure JSON */ }
  const fence = raw.match(/```(?:javascript|js|mjs|node|esm)?\s*\n([\s\S]*?)```/);
  if (fence && fence[1].includes('export default')) return fence[1].trim();
  if (raw.includes('export default')) return raw.trim();
  return null;
}

// ---------------------------------------------------------------------------
// Prompt: the exact contract the AI's module must satisfy, plus one compact,
// fully contract-conformant worked example to imitate.
// ---------------------------------------------------------------------------

const WORKED_EXAMPLE = [
  "import { frame } from '../../../lib/factories/helpers.mjs';",
  '',
  'function countVowels(text) {',
  '  var m = String(text).toLowerCase().match(/[aeiou]/g);',
  '  return m ? m.length : 0;',
  '}',
  'function countLetters(text) {',
  '  var m = String(text).toLowerCase().match(/[a-z]/g);',
  '  return m ? m.length : 0;',
  '}',
  '',
  'export default function generate(catalogItem, ctx) {',
  '  return {',
  '    entry: {',
  "      id: 'vowel-counter',",
  "      title: 'Vowel Counter',",
  "      h1: 'Vowel & Consonant Counter',",
  "      seoTitle: 'Vowel Counter — Free Online Tool | ToolNova',",
  "      description: 'Count vowels, consonants and total letters in any text with live updates and a vowel-percentage stat. Free and private.',",
  "      intro: 'Paste any text to see how many vowels and consonants it contains, updated live on every keystroke, with the vowel share of all letters.',",
  "      category: 'Text',",
  "      keywords: ['vowel counter', 'consonant counter', 'letter counter'],",
  '      popularity: 45,',
  "      blurb: 'Counts vowels and consonants in any text.',",
  '      ui: {',
  "        layout: 'single',",
  '        controls: [',
  "          { type: 'textarea', id: 'input', label: 'Your text', rows: 9, placeholder: 'Type or paste here…', mono: false }",
  '        ],',
  '        actions: [],',
  '        outputs: [',
  "          { type: 'stats', id: 'stats', label: 'Letter breakdown' }",
  '        ]',
  '      },',
  '      howItWorks: [',
  "        'Type or paste text into the box — every statistic updates live as you type.',",
  "        'The letters a, e, i, o, u count as vowels; every other letter of the alphabet counts as a consonant.',",
  "        'The vowel percentage is computed over letters only — digits, spaces and punctuation are ignored.'",
    '  ],',
  '      examples: [',
  '        \'"apple" has 2 vowels and 3 consonants, so 40% of its letters are vowels.\',',
  '        \'"rhythm" has 0 vowels and 6 consonants.\',',
  '        \'The quick brown fox contains 11 vowels across its 35 letters — about 31% vowels.\'',
  '      ],',
  '      faq: [',
  "        { q: 'Is the letter y counted as a vowel?', a: 'No. This counter treats y as a consonant in every word, which keeps the count simple, predictable and consistent with most letter-counting tools.' },",
  "        { q: 'Are accented letters like é counted?', a: 'Only plain a–z letters are matched: accented characters and non-Latin scripts are ignored rather than guessed at, so the counts stay exact for English text.' }",
  '      ]',
  '    },',
  "    js: frame('\n  var countVowels = ' + countVowels.toString() + ';\n  var countLetters = ' + countLetters.toString() + ';\n  function render() {\n    var t = control(\\'input\\').value;\n    var v = countVowels(t);\n    var total = countLetters(t);\n    setStats(\\'stats\\', [[\\'Vowels\\', v], [\\'Consonants\\', total - v], [\\'Letters\\', total], [\\'Vowel share\\', total ? Math.round((v / total) * 100) + \\'%\\' : \\'—\\']]);\n    status(total ? total + \\' letters analysed.\\' : \\'\\', total ? \\'ok\\' : \\'\\');\n  }\n  control(\\'input\\').addEventListener(\\'input\\', render);\n  render();')",
  '  };',
  '}',
  '',
  'export async function selfTest() {',
  "  if (countVowels('apple') !== 2) throw new Error('countVowels broken');",
  "  if (countLetters('rhythm') !== 6) throw new Error('countLetters broken');",
  '}'
].join('\n');

function buildPrompt(catalogItem, site, feedback) {
  const system = [
    'You are a senior JavaScript engineer generating one ECMAScript module for a zero-dependency static tools website.',
    'You respond with ONLY valid JSON of the exact shape {"code": "<the complete module source>"}. No commentary, no markdown outside the JSON string.'
  ].join(' ');

  const user = [
    `Write the complete file scripts/generators/custom/${catalogItem.id}.mjs for "${site.name}", implementing this tool:`,
    `  id: ${catalogItem.id}`,
    `  category: ${catalogItem.category}`,
    `  idea: ${catalogItem.blurb}`,
    `  keywords: ${(catalogItem.keywords || []).join(', ')}`,
    '',
    'HARD CONTRACT — every point is machine-checked; violations are rejected:',
    '1. The ONLY allowed import is exactly:',
    "   import { frame } from '../../../lib/factories/helpers.mjs';",
    '2. Export BOTH of these:',
    '   - default function generate(catalogItem, ctx) that returns { entry, js }',
    '   - async function selfTest() that throws an Error when the logic is wrong (it runs in Node with NO DOM, so it must only test your pure module-scope functions).',
    '3. Put the tool logic in pure, self-contained module-scope functions (no closures over module state, no template literals anywhere — string concatenation with + only). Embed them into the client script with fn.toString(), exactly like the example: js: frame(\'... \' + myFn.toString() + \' ...\').',
    '4. frame(body) wraps your code with this helper API available inside the body string:',
    '   control(id) → input element; setOutput(id, string); onAction(id, fn); status(message, "ok" | "error" | ""); setStats(id, [[label, value], ...]); readControls(defs) where defs=[{id,type,value}] (checkbox→bool, number/range→number, else string).',
    '5. entry must satisfy (all length rules are strict):',
    `   id: '${catalogItem.id}'   // exactly this`,
    `   category: '${catalogItem.category}'   // exactly this`,
    '   title: 3–70 chars; h1: 5–90 chars; seoTitle: 10–80 chars (suggest "<Title> — Free Online | ToolNova");',
    '   description: 60–170 chars, honest, written for searchers; intro: ≥40 chars shown under the H1;',
    '   keywords: at least 3 relevant strings; popularity: integer 40–80 (how searched-for this is); blurb: one sentence;',
    '   ui: { controls: [...], actions: [...], outputs: [...] } using ONLY these spec shapes:',
    '     control: {type:"textarea",id,label,rows?,placeholder?,mono?} | {type:"text"|"number"|"date",id,label,value?,min?,max?,step?,placeholder?,help?} | {type:"select",id,label,options:[{value,label}],value?} | {type:"checkbox",id,label,checked?} | {type:"range",id,label,min,max,step?,value?,help?}',
    '     action: {id,label,primary?}  // ids lowercase-with-dashes; at most one primary; [] allowed for live tools',
    '     output: {type:"textarea"|"text"|"pre",id,label,rows?} | {type:"stats",id,label}',
    '   howItWorks: ≥2 strings (≥15 chars each; step-by-step for THIS tool);',
    '   examples: ≥2 strings (≥10 chars) with CONCRETE numbers/inputs and their real outputs;',
    '   faq: ≥2 items {q (≥10 chars), a (≥20 chars)} that answer real user questions honestly.',
    '6. Client code rules: no network calls (no fetch/XHR/WebSocket), no eval/new Function, no imports, no alerts, no backticks/template literals, no TODO/placeholder text, no external libraries — standard browser APIs only (crypto, TextEncoder, Intl etc. are fine). Wire EVERY action and keep EVERY output filled; recompute live on "input" events when sensible; never throw on empty or invalid input — show status(message, "error") instead.',
    '7. Copy must be original and accurate — never claim features the tool does not have. Numbers quoted in examples must really come from your functions (run them mentally and double-check).',
    '',
    'HERE IS A COMPLETE WORKED EXAMPLE (a different tool — imitate its structure, never its content):',
    WORKED_EXAMPLE,
    '',
    `Now write the module for "${catalogItem.id}". It will be compiled, selfTested, validated, and the whole site rebuilt with it — it must be production-ready, fully working code.`,
    feedback ? `\nYOUR PREVIOUS ATTEMPT FAILED with this error — fix it and output the complete corrected module:\n${feedback}` : ''
  ].join('\n');

  return { system, user };
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

function parseResetTime(res) {
  const retryAfter = res.headers.get('retry-after');
  if (retryAfter) {
    const seconds = parseFloat(retryAfter);
    if (!isNaN(seconds) && seconds > 0) return seconds * 1000;
  }
  const resetTokens = res.headers.get('x-ratelimit-reset-tokens');
  if (resetTokens) {
    let ms = 0;
    const mMatch = resetTokens.match(/(\d+)m/);
    const sMatch = resetTokens.match(/([\d.]+)s/);
    const msMatch = resetTokens.match(/(\d+)ms/);
    if (msMatch) {
      ms += parseInt(msMatch[1], 10);
    } else {
      if (mMatch) ms += parseInt(mMatch[1], 10) * 60 * 1000;
      if (sMatch) ms += parseFloat(sMatch[1]) * 1000;
    }
    if (ms > 0) return ms;
  }
  return 60000; // fallback to 60s
}

async function callGroqRaw({ system, user }, timeoutMs = 240000) {
  const config = getAIConfig();
  // Ordered model list from getAIConfig (configured first, then provider
  // fallbacks). A retired model 404s with model_not_found — instead of
  // burning the whole run on a dead id we roll to the next one.
  const models = (config.models && config.models.length) ? config.models : [config.model];
  // 4 attempts only makes sense for fast retryable errors (429 with a short
  // reset). Slow providers (queueing free tiers) are better served by a long
  // single timeout than by retrying aborts — so timeouts get max 2 attempts.
  const maxAttempts = 2;
  let delay = 10000;
  let modelIdx = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const model = models[Math.min(modelIdx, models.length - 1)];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(config.endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${config.key}`
        },
        body: JSON.stringify({
          model,
          temperature: 0.35,
          max_tokens: 8000,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ]
        })
      });

      if (res.status === 429) {
        if (attempt === maxAttempts) {
          throw new Error(`${config.provider} HTTP 429 (Rate Limit) after ${maxAttempts} attempts.`);
        }
        const waitMs = parseResetTime(res) + 2000;
        if (waitMs > 60000) {
          throw new Error(`${config.provider} HTTP 429 Rate Limit reset time is too long (${(waitMs / 1000).toFixed(1)}s). Aborting retries.`);
        }
        console.warn(`⏳ ${config.provider} HTTP 429 Rate Limit hit. Retrying in ${(waitMs / 1000).toFixed(1)}s (attempt ${attempt}/${maxAttempts})...`);
        clearTimeout(timer);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }

      // Retired/unavailable model → roll to the next candidate model rather
      // than failing the authoring attempt.
      const bodyText = res.status === 404 ? await res.text().catch(() => '') : '';
      if (isModelNotFound(res, bodyText) && modelIdx < models.length - 1) {
        modelIdx++;
        console.warn(`⚠️ ${config.provider} model "${model}" not available (model_not_found). Trying "${models[modelIdx]}"…`);
        clearTimeout(timer);
        continue;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        // Deterministic client errors (401 bad key / 400 model name, 403, 422)
        // will never succeed on a retry — fail fast instead of burning the
        // run's backoff budget.
        const err = new Error(`${config.provider} HTTP ${res.status}: ${body.slice(0, 160)}`);
        if (res.status >= 400 && res.status < 500 && res.status !== 429) err.noRetry = true;
        throw err;
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error(`${config.provider} returned an empty completion`);
      return content;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`${config.provider} request timed out after ${timeoutMs}ms`);
      }
      if (attempt === maxAttempts || err.message.includes('Aborting retries') || err.noRetry) {
        throw err;
      }
      console.warn(`⚠️ ${config.provider} request attempt ${attempt} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
      clearTimeout(timer);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5;
    } finally {
      clearTimeout(timer);
    }
  }
}

// Built-in deterministic author — proves the whole authoring path (scan →
// import → generate → selfTest → validate) without touching any network.
function mockProvider(catalogItem) {
  const title = catalogItem.id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const blurb = catalogItem.blurb || `${title} — a free browser tool.`;
  const kws = [...(catalogItem.keywords || []), 'free', 'online'].slice(0, 6);
  const lines = [
    "import { frame } from '../../../lib/factories/helpers.mjs';",
    '',
    'function analyzeText(text) {',
    '  var counts = { letters: 0, digits: 0, spaces: 0, other: 0 };',
    '  for (var i = 0; i < text.length; i++) {',
    '    var ch = text[i];',
    '    if (/[a-z]/i.test(ch)) counts.letters++;',
    '    else if (/[0-9]/.test(ch)) counts.digits++;',
    '    else if (/\\s/.test(ch)) counts.spaces++;',
    '    else counts.other++;',
    '  }',
    '  counts.total = text.length;',
    '  return counts;',
    '}',
    '',
    'export default function generate(catalogItem, ctx) {',
    '  return {',
    '    entry: {',
    '      id: catalogItem.id,',
    '      title: ' + JSON.stringify(title) + ',',
    '      h1: ' + JSON.stringify(title + ' — instant character analysis') + ',',
    '      seoTitle: ' + JSON.stringify(`${title} — Free Online Tool | ToolNova`) + ',',
    '      description: ' + JSON.stringify((blurb.replace(/\.*$/, '.') + ' Live counts of letters, digits, spaces and symbols — free, private, in-browser.').slice(0, 168)) + ',',
    '      intro: ' + JSON.stringify(blurb.replace(/\.*$/, '.') + ' Letter, digit, space and symbol counts update live as you type — everything runs locally in your browser.') + ',',
    '      category: catalogItem.category,',
    '      keywords: ' + JSON.stringify(kws) + ',',
    '      popularity: 40,',
    '      blurb: ' + JSON.stringify(blurb) + ',',
    '      ui: {',
    "        layout: 'single',",
    '        controls: [',
    "          { type: 'textarea', id: 'input', label: 'Your text', rows: 9, placeholder: 'Type or paste here…', mono: false }",
    '        ],',
    '        actions: [],',
    '        outputs: [{ type: ' + "'stats', id: 'stats', label: 'Character analysis' }]",
    '      },',
    '      howItWorks: [',
    "        'Type or paste any text — the counters update live with every keystroke.',",
    "        'Characters are classified as letters, digits, whitespace or other symbols and totalled.',",
    "        'Everything is computed locally; your text never leaves the browser tab.'",
    '      ],',
    '      examples: [',
    "        '\"Hello 123!\" gives 5 letters, 3 digits, 1 space and 1 symbol — 10 characters total.',",
    "        'Pasting a 260-character draft shows its exact length instantly, no clicking needed.'",
    '      ],',
    '      faq: [',
    "        { q: 'What counts as a symbol in the analysis?', a: 'Anything that is not a letter, digit or whitespace character — punctuation, emoji and control characters are grouped as other symbols.' },",
    "        { q: 'Is there a text length limit for this tool?', a: 'No practical limit — analysis runs locally on your device and stays instant even for very long documents.' }",
    '      ]',
    '    },',
    "    js: frame('  var analyzeText = ' + analyzeText.toString() + ';  function render() { var a = analyzeText(control(\\'input\\').value); setStats(\\'stats\\', [[\\'Total\\', a.total], [\\'Letters\\', a.letters], [\\'Digits\\', a.digits], [\\'Spaces\\', a.spaces], [\\'Symbols\\', a.other]]); }  control(\\'input\\').addEventListener(\\'input\\', render); render();')",
    '  };',
    '}',
    '',
    'export async function selfTest() {',
    "  var a = analyzeText('Hello 123!');",
    "  if (a.letters !== 5 || a.digits !== 3 || a.spaces !== 1 || a.other !== 1 || a.total !== 10) {",
    "    throw new Error('analyzeText produced wrong counts');",
    '  }',
    '}'
  ];
  return JSON.stringify({ code: lines.join('\n') });
}

// ---------------------------------------------------------------------------
// Main entry: author one module with up to 2 generations (second gets the
// exact failure message). `createModule(code)` must fully build-and-check the
// module and either return { entry, js } or throw with a helpful message.
// ---------------------------------------------------------------------------

export async function authorModule(catalogItem, site, createModule) {
  const provider = resolveProvider();
  if (provider === 'none') return { ok: false, reason: 'no-provider' };

  let feedback = null;
  let lastError = 'no attempts made';
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const prompt = buildPrompt(catalogItem, site, feedback);
    let raw;
    try {
      raw = provider === 'mock' ? mockProvider(catalogItem) : await callGroqRaw(prompt);
    } catch (err) {
      lastError = err.message;
      feedback = `The API call itself failed: ${err.message}`;
      continue;
    }

    const code = extractCode(raw);
    if (!code) {
      lastError = 'could not extract module code from the model response';
      feedback = lastError;
      continue;
    }
    const scanProblems = staticScan(code);
    if (scanProblems.length) {
      lastError = `static scan: ${scanProblems.join('; ')}`;
      feedback = `Your code was rejected by the static safety scan: ${scanProblems.join('; ')}. Remove the offending constructs and output the full corrected module.`;
      continue;
    }
    try {
      const built = await createModule(code);
      return { ok: true, ...built, attempts: attempt, provider };
    } catch (err) {
      lastError = String(err.message || err).split('\n').slice(0, 6).join(' | ');
      feedback = `Your module compiled or validated with errors: ${lastError}. Fix them and output the complete corrected module.`;
    }
  }
  return { ok: false, reason: 'exhausted', error: lastError };
}

// Shared with the catalog gardener and any future AI steps.
export const callGroq = callGroqRaw;
