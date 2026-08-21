// Optional AI assist for the daily pipeline.
//
// If GROQ_API_KEY is set (Groq has a free tier), an LLM picks which catalog
// candidate is likely to have the highest organic search demand today.
// The pipeline NEVER depends on this: on any failure, timeout or missing key
// it silently falls back to deterministic catalog order, and the AI never
// writes tool code — all generated tools come from vetted, tested factories.

import { readFileSync } from 'node:fs';
import path from 'node:path';

let envLoaded = false;
function loadEnv() {
  if (envLoaded) return;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.slice(0, index).trim();
        let val = trimmed.slice(index + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined && val && val !== 'your_opencode_zen_api_key_here' && val !== 'your_actual_opencode_zen_api_key') {
          process.env[key] = val;
        }
      }
    }
  } catch {
    // ignore
  }
  envLoaded = true;
}

// Load env immediately at module initialization
loadEnv();

// Models are retired without warning on free tiers, which silently breaks the
// whole pipeline: every AI call 404s → no tool authored → no commit → no
// posts, while the run still reports green. Keep an ordered fallback list per
// provider so a single dead model never kills the run; getAIConfig() exposes
// the resolved list as `config.models` and the call sites try each in turn.
const GROQ_MODEL_FALLBACKS = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'llama3-8b-8192', 'llama3-70b-8192'];
const ZEN_MODEL_FALLBACKS = ['deepseek-v4-flash-free', 'deepseek-chat'];

function resolveModels(provider, configured) {
  const list = provider === 'groq' ? GROQ_MODEL_FALLBACKS
             : provider === 'opencode-zen' ? ZEN_MODEL_FALLBACKS
             : [];
  const ordered = [];
  if (configured) ordered.push(configured);
  for (const m of list) if (!ordered.includes(m)) ordered.push(m);
  return ordered;
}

// A 404 carrying model_not_found means the configured model id was retired or
// is unavailable on this key — NOT a real error. Callers use this to fall
// through to the next candidate model instead of failing the run.
export function isModelNotFound(res, bodyText) {
  if (res.status !== 404) return false;
  return /model_not_found|does not exist or you do not have access to it/i.test(bodyText || '');
}

export function getAIConfig() {
  // Trim: repo/org variables can arrive with stray whitespace (e.g. a
  // trailing CRLF pasted value), which would silently fail every branch
  // and fall through to auto-detection with the wrong provider.
  const provider = (process.env.AI_PROVIDER || 'auto').toLowerCase().trim();
  const configuredModel = (process.env.AI_MODEL || '').trim();

  if (provider === 'opencode-zen') {
    const key = process.env.OPENCODE_API_KEY || process.env.GROQ_API_KEY || '';
    const endpoint = process.env.AI_ENDPOINT || 'https://opencode.ai/zen/v1/chat/completions';
    // opencode.ai's zen gateway serves Hermes-style model names (e.g.
    // deepseek-v4-flash-free); the classic "deepseek-chat" alias is rejected
    // with ModelError.
    const model = configuredModel || 'deepseek-v4-flash-free';
    return { provider, key, endpoint, model, models: resolveModels(provider, model), available: Boolean(key) };
  }

  if (provider === 'groq') {
    const key = process.env.GROQ_API_KEY || '';
    const endpoint = process.env.AI_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions';
    // llama-3.3-70b-versatile was retired on Groq's free tier, which is what
    // broke the daily run (every authoring call 404'd). Default to a model
    // that is currently available; resolveModels() adds fallbacks so a future
    // retirement degrades to the next model instead of killing the run.
    const model = configuredModel || 'llama-3.1-8b-instant';
    return { provider, key, endpoint, model, models: resolveModels(provider, model), available: Boolean(key) };
  }
  
  if (provider === 'none') {
    return { provider: 'none', key: '', endpoint: '', model: '', models: [], available: false };
  }
  
  if (provider === 'mock') {
    return { provider: 'mock', key: '', endpoint: '', model: 'mock', models: ['mock'], available: true };
  }
  
  // auto-detect
  if (process.env.OPENCODE_API_KEY) {
    return {
      provider: 'opencode-zen',
      key: process.env.OPENCODE_API_KEY,
      endpoint: process.env.AI_ENDPOINT || 'https://opencode.ai/zen/v1/chat/completions',
      model: configuredModel || 'deepseek-v4-flash-free',
      models: resolveModels('opencode-zen', configuredModel || 'deepseek-v4-flash-free'),
      available: true
    };
  }
  
  if (process.env.GROQ_API_KEY) {
    return {
      provider: 'groq',
      key: process.env.GROQ_API_KEY,
      endpoint: process.env.AI_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions',
      model: configuredModel || 'llama-3.1-8b-instant',
      models: resolveModels('groq', configuredModel || 'llama-3.1-8b-instant'),
      available: true
    };
  }
  
  return { provider: 'none', key: '', endpoint: '', model: '', models: [], available: false };
}

export function aiAvailable() {
  const config = getAIConfig();
  return config.available && config.provider !== 'none' && config.provider !== 'mock';
}

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

export async function rankWithAI(candidates, site) {
  if (!aiAvailable() || candidates.length < 2) return null;

  const shortlist = candidates.slice(0, 40).map((c) => ({
    id: c.id,
    category: c.category,
    blurb: c.blurb || '',
    keywords: (c.keywords || []).slice(0, 4)
  }));

  const prompt = [
    `You are an SEO strategist for "${site.name}", a website of free browser-based tools.`,
    'From the JSON list of candidate tools, pick the ONE most likely to attract the highest organic Google search demand while being broadly useful.',
    'Consider search volume, evergreen demand and how well it rounds out the collection.',
    'Respond with ONLY valid JSON in this exact shape: {"id":"<one id from the list>","reason":"<max 15 words>"}',
    'Candidates:',
    JSON.stringify(shortlist)
  ].join('\n');

  const config = getAIConfig();
  const models = (config.models && config.models.length) ? config.models : [config.model];
  const maxAttempts = 3;
  let delay = 5000;
  let modelIdx = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const model = models[Math.min(modelIdx, models.length - 1)];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
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
          temperature: 0.2,
          max_tokens: 120,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are an SEO strategist. You answer with strict JSON only.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      if (res.status === 429) {
        if (attempt === maxAttempts) throw new Error(`${config.provider} HTTP 429 Rate Limit reached`);
        const waitMs = parseResetTime(res) + 2000;
        if (waitMs > 60000) {
          throw new Error(`${config.provider} HTTP 429 Rate Limit reset time is too long (${(waitMs / 1000).toFixed(1)}s). Aborting retries.`);
        }
        console.warn(`⏳ ${config.provider} ranking HTTP 429 Rate Limit. Retrying in ${(waitMs / 1000).toFixed(1)}s (attempt ${attempt}/${maxAttempts})...`);
        clearTimeout(timer);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
      // A retired/unavailable model returns 404 model_not_found — fall
      // through to the next candidate model instead of aborting ranking.
      const bodyText = res.status === 404 ? await res.text().catch(() => '') : '';
      if (isModelNotFound(res, bodyText)) {
        if (modelIdx < models.length - 1) {
          modelIdx++;
          console.warn(`⚠️ ${config.provider} model "${model}" not available (model_not_found). Trying "${models[modelIdx]}"…`);
          clearTimeout(timer);
          continue;
        }
        throw new Error(`${config.provider} model "${model}" not available (model_not_found)`);
      }
      clearTimeout(timer);
      if (!res.ok) {
        const err = new Error(`${config.provider} HTTP ${res.status}`);
        if (res.status >= 400 && res.status < 500 && res.status !== 429) err.noRetry = true;
        throw err;
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);
      const pick = candidates.find((c) => c.id === parsed.id);
      if (!pick) throw new Error(`model picked unknown id "${parsed.id}"`);
      const rest = candidates.filter((c) => c.id !== pick.id);
      console.log(`🤖 AI picked "${pick.id}" (model ${model}) — ${parsed.reason || 'highest expected search demand'}`);
      return [pick, ...rest];
    } catch (err) {
      clearTimeout(timer);
      if (attempt === maxAttempts || err.message.includes('Aborting retries') || err.noRetry) {
        console.warn(`AI ranking unavailable (${err.message}); falling back to catalog order.`);
        return null;
      }
      console.warn(`⚠️ ${config.provider} ranking attempt ${attempt} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5;
    }
  }
}
