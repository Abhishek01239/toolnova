// Optional AI assist for the daily pipeline.
//
// If GROQ_API_KEY is set (Groq has a free tier), an LLM picks which catalog
// candidate is likely to have the highest organic search demand today.
// The pipeline NEVER depends on this: on any failure, timeout or missing key
// it silently falls back to deterministic catalog order, and the AI never
// writes tool code — all generated tools come from vetted, tested factories.

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export function aiAvailable() {
  return Boolean(process.env.GROQ_API_KEY && process.env.AI_PROVIDER !== 'none');
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

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || DEFAULT_MODEL,
        temperature: 0.2,
        max_tokens: 120,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are an SEO strategist. You answer with strict JSON only.' },
          { role: 'user', content: prompt }
        ]
      })
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    const pick = candidates.find((c) => c.id === parsed.id);
    if (!pick) throw new Error(`model picked unknown id "${parsed.id}"`);
    const rest = candidates.filter((c) => c.id !== pick.id);
    console.log(`🤖 AI picked "${pick.id}" — ${parsed.reason || 'highest expected search demand'}`);
    return [pick, ...rest];
  } catch (err) {
    console.warn(`AI ranking unavailable (${err.message}); falling back to catalog order.`);
    return null;
  }
}
