// Optional AI assist for the daily pipeline.
//
// If GROQ_API_KEY is set (Groq has a free tier), an LLM picks which catalog
// candidate is likely to have the highest organic search demand today.
// The pipeline NEVER depends on this: on any failure, timeout or missing key
// it silently falls back to deterministic catalog order, and the AI never
// writes tool code — all generated tools come from vetted, tested factories.

export function getAIConfig() {
  const provider = (process.env.AI_PROVIDER || 'auto').toLowerCase();
  
  if (provider === 'opencode-zen') {
    const key = process.env.OPENCODE_API_KEY || process.env.GROQ_API_KEY || '';
    const endpoint = process.env.AI_ENDPOINT || 'https://opencode.ai/zen/v1/chat/completions';
    const model = process.env.AI_MODEL || 'deepseek-chat';
    return { provider, key, endpoint, model, available: Boolean(key) };
  }
  
  if (provider === 'groq') {
    const key = process.env.GROQ_API_KEY || '';
    const endpoint = process.env.AI_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions';
    const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
    return { provider, key, endpoint, model, available: Boolean(key) };
  }
  
  if (provider === 'none') {
    return { provider: 'none', key: '', endpoint: '', model: '', available: false };
  }
  
  if (provider === 'mock') {
    return { provider: 'mock', key: '', endpoint: '', model: '', available: true };
  }
  
  // auto-detect
  if (process.env.OPENCODE_API_KEY) {
    return {
      provider: 'opencode-zen',
      key: process.env.OPENCODE_API_KEY,
      endpoint: process.env.AI_ENDPOINT || 'https://opencode.ai/zen/v1/chat/completions',
      model: process.env.AI_MODEL || 'deepseek-chat',
      available: true
    };
  }
  
  if (process.env.GROQ_API_KEY) {
    return {
      provider: 'groq',
      key: process.env.GROQ_API_KEY,
      endpoint: process.env.AI_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions',
      model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
      available: true
    };
  }
  
  return { provider: 'none', key: '', endpoint: '', model: '', available: false };
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
  const maxAttempts = 3;
  let delay = 5000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
          model: config.model,
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
        console.warn(`⏳ ${config.provider} ranking HTTP 429 Rate Limit. Retrying in ${(waitMs / 1000).toFixed(1)}s (attempt ${attempt}/${maxAttempts})...`);
        clearTimeout(timer);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
      clearTimeout(timer);
      if (!res.ok) throw new Error(`${config.provider} HTTP ${res.status}`);
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);
      const pick = candidates.find((c) => c.id === parsed.id);
      if (!pick) throw new Error(`model picked unknown id "${parsed.id}"`);
      const rest = candidates.filter((c) => c.id !== pick.id);
      console.log(`🤖 AI picked "${pick.id}" — ${parsed.reason || 'highest expected search demand'}`);
      return [pick, ...rest];
    } catch (err) {
      clearTimeout(timer);
      if (attempt === maxAttempts) {
        console.warn(`AI ranking unavailable (${err.message}); falling back to catalog order.`);
        return null;
      }
      console.warn(`⚠️ Groq ranking attempt ${attempt} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5;
    }
  }
}
