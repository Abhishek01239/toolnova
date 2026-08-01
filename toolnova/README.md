# ⚒️ ToolNova

**Free online tools, one new tool every day** — a self-growing utility website that builds, tests, documents and deploys a brand-new browser tool every morning, fully automatically, for **$0**.

- 🌱 **11 tools live today**, ~100 more already queued in the backlog
- 🤖 **Daily autonomous pipeline** (GitHub Actions cron) with a hard quality gate — a tool only ships if tests, build and verification pass
- 🔒 **Privacy-first**: every tool runs 100% in the browser; nothing is ever uploaded
- 🚀 **Zero dependencies**: plain Node (20+) scripts generate a static site, deployed free on Vercel
- 🔍 **SEO-complete**: unique titles/descriptions, canonical URLs, OpenGraph + Twitter cards, JSON-LD (WebApplication, FAQPage, BreadcrumbList, ItemList), breadcrumbs, FAQ, sitemap.xml, robots.txt, internal linking — all generated, all verified

---

## Quick start

```bash
git clone <your-repo-url> && cd toolnova

# No npm install needed — there are literally zero dependencies.
node scripts/build.mjs   # build the whole site into dist/
node scripts/verify.mjs  # audit the output (SEO, links, schema, syntax)
node --test tests/       # run the unit test suite

# Preview locally
cd dist && python3 -m http.server 4173   # → http://localhost:4173
```

Add a new tool right now (the exact same command the robot runs every morning):

```bash
node scripts/add-daily-tool.mjs            # adds ONE new tool, fully gated
node scripts/add-daily-tool.mjs --dry-run  # preview without writing
node scripts/add-daily-tool.mjs --count=3  # add several (for catch-up/seeding)
```

---

## Deploy (5 minutes, $0)

1. **GitHub** — create a repo, push this code:
   ```bash
   git init && git add -A && git commit -m "feat: initial ToolNova site"
   git branch -M main && git remote add origin https://github.com/<you>/toolnova.git
   git push -u origin main
   ```
2. **Vercel** — `vercel.com/new` → Import the repo → **Other** framework preset. The included `vercel.json` already sets `buildCommand: node scripts/build.mjs` and `outputDirectory: dist`. Deploy. (Free tier, no secrets needed.)
3. **Update `data/site.json`** — set `url` to your real domain (canonical/sitemap/OG depend on it), and `repo` to your GitHub URL.
4. **Daily automation** — in GitHub: *Settings → Actions → General → Workflow permissions → **Read and write*** (needed so the bot can commit the new tool). The `.github/workflows/daily-tool.yml` cron ([`30 2 * * *`](https://crontab.guru/#30_2_*_*_*) = 08:00 IST / 02:30 UTC) then runs every morning. You can also trigger it manually: *Actions → Daily Tool → Run workflow*.

That's it. Every push to `main` auto-deploys on Vercel; every morning the bot pushes one new tool.

### Optional: AI inside the daily agent (Groq free tier)

The pipeline never *needs* AI — but with one free secret it gains two superpowers:

1. **AI candidate ranking** — an LLM picks *which* queued tool ships today, based on likely search demand (`lib/ai.mjs`).
2. **The AI author** — an LLM *writes the code* for the day's custom tool (`lib/ai-author.mjs`). When the next queued idea has no module yet, the agent asks the model to produce a complete `scripts/generators/custom/<id>.mjs` implementing it.

Setup: create a free key at [console.groq.com](https://console.groq.com) → GitHub *Settings → Secrets and variables → Actions* → secret `GROQ_API_KEY`. Done. Tune with repo variables: `AI_MODEL` (default `llama-3.3-70b-versatile`), `AI_PROVIDER` (`auto`/`groq`/`mock`/`none`), `AI_BUDGET` (max model calls per run, default `4`).

#### How the AI author stays safe — "the AI proposes, the gate disposes"

```
 queued custom idea (no module yet)
        │
        ▼
  strict prompt: hard module contract + worked example
        ▼
  LLM outputs {"code": "...complete .mjs module..."}
        ▼
  extraction + static safety scan ─────────► rejected: fetch, eval, new Function,
        │                                     dynamic import, require, process.env,
        │                                     alert, TODO/FIXME, innerHTML =, backticks
        ▼
  compile as temp module → import → generate() → registry validation
        │                                    → the module's own selfTest() runs in Node
        ▼
  failure? ──► retry ONCE with the exact error message as feedback
        ▼
  normal quality gate: unit tests → full site build → SEO/link/schema verify
        ▼
  PASS → module + tool committed, deployed   |   FAIL → module deleted, run falls
                                                     back to vetted factory tools
```

Design guarantees: AI modules must implement logic as pure functions and ship their own `selfTest()` (executed before acceptance); every entry must satisfy the same `lib/registry.js` contract as hand-written tools; the run's total model calls are budget-capped; and **without any key, everything above silently disables** and factories keep shipping daily forever. AI-committed tools say so in their commit log line (🤖). For local testing of the authoring path with no key: `AI_PROVIDER=mock node scripts/add-daily-tool.mjs` uses a deterministic built-in author (never commit mock output to production — it's for exercising the machinery).

#### Staying fed forever: the backlog gardener

The daily run can only ship a tool if the queue holds *new, unique, useful* ideas — so the queue replenishes itself (`lib/ai-gardener.mjs` + `scripts/tend-catalog.mjs`):

- **Weekly**, `.github/workflows/garden-catalog.yml` (Mondays 09:00 IST) asks the LLM for fresh tool ideas and plants the good ones.
- **Self-top-up**: whenever the daily run sees the backlog drop below `GARDEN_MIN` (default 14 ideas) and an AI provider exists, it gardens *first*, then picks today's tool — the pipeline cannot starve.

Nothing enters the queue without deterministic filtering, AI output notwithstanding:

| Promise | Enforcement |
|---|---|
| **New** | Proposals must not already exist; queued ideas are unique in the catalog; shipped tools are unique in `tools.json` |
| **Unique** | Exact match + normalized match (dashes stripped) + token‑similarity (Jaccard > 0.6) against *everything live or queued* — "word-counter-tool" can never shadow "word-counter"; factory configs (codec/kind/generator) can't be claimed twice |
| **Useful** | Category allowlist, 3+ real search keywords, 30–220-char blurb required; brand-safety blocklist (adult/gambling/scam terms); factory mapping only for unambiguous fits — anything else goes to the AI author |

The gardener is also testable offline: `AI_PROVIDER=mock node scripts/tend-catalog.mjs` plants deterministic ideas (and demonstrates 4 rejection classes) with no API key.

---

## How the daily pipeline works

```
                     ┌──────────────── GitHub Actions (cron 08:00 IST) ────────────────┐
                     │                                                                  │
  data/catalog.json ─┼─► pick 1st catalog entry not in data/tools.json (AI may re-rank) │
  (the backlog)      │                                                                  │
                     │   factory tool ──► generate from lib/factories/* (vetted fns)     │
                     │   custom tool  ──► scripts/generators/custom/<id>.mjs             │
                     │       no module? ──► AI author writes it (scan→compile→selfTest,  │
                     │       1 feedback retry; else skip to next candidate)              │
                     │                                                                  │
                     │   validate entry (lib/registry.js)  ◄── SEO/UX contract           │
                     │   write tools/<id>.js + tools.json                                │
                     │                                                                  │
                     │   QUALITY GATE: node --test → build → verify                      │
                     │      • 30+ unit tests of every transform/codec/converter          │
                     │      • every page: 1 H1, unique title, meta desc, canonical,      │
                     │        OG/Twitter tags, parseable JSON-LD, FAQ + HowItWorks       │
                     │      • every internal link + asset resolves (incl. anchors)       │
                     │      • every generated JS file passes node --check                │
                     │      • sitemap ↔ pages, robots.txt, search index                  │
                     │                                                                  │
                     │   any failure ──► rollback & try next candidate (never ships bad) │
                     │   success ──► git commit + push ──► Vercel auto-deploy            │
                     └──────────────────────────────────────────────────────────────────┘
```

**Duplicate protection:** candidates are exactly the catalog entries whose `id` is not in `tools.json`, so a tool can never ship twice. **Never-stop guarantee:** on any candidate failure the script rolls back and tries the next one, only exiting non-zero if the entire backlog fails.

---

## Adding tools (the part that scales)

There are two ways a tool enters the world. The catalog (`data/catalog.json`) is the single release queue — ~100 ideas already wait there.

### 1. Factory tools (instant, recommended for families)

Four parameterized factories can each produce many distinct, real tools:

| Factory | Produces | Catalog params |
|---|---|---|
| `text-transform` | Case converters, line sorters, extractors, cleaners… | `transforms: [keys]` from the vetted registry (see `lib/factories/text-transform.mjs`) |
| `encoder-decoder` | Base64, URL, hex, binary, entities, ROT13, unicode escapes | `codec: <key>` |
| `random-generator` | Random number, dice, coin, color, letter, date, yes/no | `generator: <key>` |
| `unit-converter` | One page per quantity (length, mass, temp, speed, data, area, volume, time) | `kind: <key>` |

Add an entry to `data/catalog.json`:

```json
{
  "id": "sort-lines-by-length",
  "factory": "text-transform",
  "category": "Text",
  "keywords": ["sort by length", "sort lines", "text sorter"],
  "blurb": "Sort the lines of any text from shortest to longest or the reverse.",
  "params": { "title": "Sort Lines by Length", "transforms": ["sort-lines"] }
}
```

Done — the next daily run generates, tests and ships it. (New transform kinds are added once in the vetted registry + unit tests, then reused forever.)

### 2. Custom tools (for anything richer)

Create `scripts/generators/custom/<tool-id>.mjs`:

```js
import { frame } from '../../../lib/factories/helpers.mjs';

export default function generate(catalogItem, ctx) {
  return {
    entry: {
      id: 'my-tool',
      title: 'My Tool',
      h1: 'My Tool — what it does',
      seoTitle: 'My Tool — Free Online | ToolNova',
      description: 'Between 60 and 170 characters, written for searchers.',
      intro: 'A sentence or two under the H1, at least 40 characters.',
      category: 'Text',
      keywords: ['my', 'tool', 'keywords'],
      popularity: 50,
      ui: {
        controls: [{ type: 'textarea', id: 'input', label: 'Input', rows: 8 }],
        actions: [{ id: 'run', label: 'Run', primary: true }],
        outputs: [{ type: 'textarea', id: 'output', label: 'Result' }]
      },
      howItWorks: ['Step one…', 'Step two…'],
      examples: ['Concrete example one.', 'Concrete example two.'],
      faq: [
        { q: 'A real question?', a: 'A genuinely useful answer of at least 20 characters.' },
        { q: 'Another question?', a: 'Another useful answer, written for humans first.' }
      ]
    },
    js: frame(`  onAction('run', function () { setOutput('output', control('input').value); });`)
  };
}
```

The UI spec (`controls`/`actions`/`outputs`) renders accessible, theme-aware markup automatically; `frame()` gives your script a standard helper API (`control`, `setOutput`, `onAction`, `status`, `setStats`, `readControls`). Put your core logic in `lib/fns/` as pure self-contained functions — they get unit-tested once, then serialized verbatim into the client bundle via `fn.toString()`, so **the tested code literally is the shipped code**. Add the matching `custom` entry to `catalog.json` and it's in tomorrow's run.

### Rules enforced on every tool (the no-placeholder contract)

Unique kebab id · 3 keyword min · 60–170 char description · H1 ≤ 90 chars · ≥ 2 each of how-it-works steps, examples, FAQs · valid UI spec · working client script · no duplicate title anywhere on the site. (`lib/registry.js`)

---

## Repository map

```
data/
  site.json        ← brand, URL, tagline, repo (edit me first!)
  catalog.json     ← the release backlog (~100 ideas) in priority order
  tools.json       ← live registry (the robot appends here)
lib/
  html.js seo.js layout.js render.js registry.js categories.js
  ai.mjs           ← optional AI candidate ranking (Groq free tier)
  ai-author.mjs    ← optional AI module writer (prompt contract, safety scan, retry)
  ai-gardener.mjs  ← optional AI idea gardener (uniqueness + quality filters)
  fns/             ← pure, unit-tested functions (transforms, codecs, units, age, slug, lorem…)
  factories/       ← parameterized tool generators (+ helpers: frame, SEO composer)
components/        ← navbar, footer, breadcrumbs, tool cards, logo (template functions)
pages/             ← home, search, categories, category, latest, popular, about, privacy, 404
tools/<id>.js      ← generated client-side tool logic (committed; what browsers run)
public/assets/     ← site.css (design system, light/dark), core.js, search.js, favicon, og.jpg
scripts/
  add-daily-tool.mjs  ← the robot (run by cron; also your "add one now" command)
  tend-catalog.mjs    ← the gardener (weekly cron; plants new unique ideas)
  build.mjs           ← static site generator → dist/
  verify.mjs          ← post-build auditor (fails builds, never passes bad pages)
  generators/custom/  ← hand-written + 🤖 AI-authored tool modules
tests/             ← node --test suites (fns, registry, seo, catalog, factories, ai-author, gardener)
.github/workflows/
  daily-tool.yml     ← the cron (08:00 IST daily; manual dispatch with count input)
  garden-catalog.yml ← weekly backlog top-up (Mondays 09:00 IST)
  ci.yml             ← tests+build+verify on every push/PR
vercel.json        ← buildCommand/outputDirectory/header caching
```

## Design & accessibility

Mobile-first responsive layout, light/dark theme with `prefers-color-scheme` + saved preference (no flash), skip-link, focus-visible rings, semantic landmarks, labeled controls, `aria-live` status regions, reduced-motion support, system font stack (no webfont latency). One CSS file (~14 KB), one 2 KB core script; each tool loads only its own small script — easy 95+ Lighthouse territory.

## SEO coverage (per page: title, meta description, H1, H2s, canonical, OG, Twitter, JSON-LD, breadcrumbs, FAQ, internal links, related tools, sitemap entry)

Home · tool pages · category pages (auto-created per category with tools) · latest · popular · categories index · search · about · privacy · custom 404. `sitemap.xml` and `robots.txt` regenerate with every deploy; nav/footer/search index always reflect the live registry.

## Cost

| Item | Cost |
|---|---|
| Hosting (Vercel free tier / Cloudflare Pages also works — just point it at `dist`) | $0 |
| CI minutes (GitHub Actions free for public repos; ~1 min/run/day) | $0 |
| Optional Groq ranking (free tier) | $0 |
| Domain (optional) | ~$10/yr if wanted |

## Roadmap ideas (already in the backlog)

QR codes (vendor the MIT `qrcode-generator` single file), PDF merge/split via vendored `pdf-lib`, image tools on `<canvas>`, JWT decoder, regex tester, diff checker, meta-tag & robots.txt generators, color contrast checker, cron explainer, 15+ finance/date calculators, CSS generators… The backlog format supports any of them the moment a custom module (human- or AI-written) lands in `scripts/generators/custom/`.

## License

MIT — see [LICENSE](./LICENSE). Tool code and copy are original works created for this project; no third-party branding or copyrighted material.
