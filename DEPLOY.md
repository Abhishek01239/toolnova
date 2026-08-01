# Deploy ToolNova — 10-minute checklist

Do these once. After that the site runs itself.

## 1. Push the code to GitHub

1. Go to https://github.com/new → repository name: `toolnova` → Create (keep "Initialize with README" **unchecked**).
2. In a terminal inside this folder:

```bash
git init -b main
git add -A
git commit -m "ToolNova: 11 tools, autonomous daily pipeline"
git remote add origin https://github.com/<YOUR-USERNAME>/toolnova.git
git push -u origin main
```

## 2. Connect Vercel

1. Go to https://vercel.com → sign up with GitHub (free Hobby plan).
2. **Add New → Project → Import** the `toolnova` repo.
3. Framework Preset: **Other**. Leave build settings as-is (`vercel.json` already sets build command `node scripts/build.mjs` and output directory `dist`).
4. Click **Deploy**. Wait ~1 minute → your site is live at a URL like `https://toolnova-xxxx.vercel.app`.

## 3. Tell the site its real URL (important for SEO)

Edit `data/site.json`:

```json
"url": "https://toolnova-xxxx.vercel.app",     // your real Vercel URL, no trailing slash
"repo": "https://github.com/<YOUR-USERNAME>/toolnova"
```

Commit and push. This fixes canonical URLs, sitemap, and OG tags.

## 4. Let GitHub Actions commit new tools

Repo → **Settings → Actions → General → Workflow permissions** → select **"Read and write permissions"** → Save.
(Without this, the daily run will fail when trying to push the new tool.)

## 5. (Optional but recommended) Add the free AI key

This lets the pipeline also build fully custom tools (BMI calculator, JWT decoder, …), not just factory-based ones.

1. Get a free key at https://console.groq.com → API Keys → Create.
2. Repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - Name: `GROQ_API_KEY`
   - Value: your key

No key? No problem — the daily pipeline still works, using the built-in factory backlog (~35 ready entries ≈ first month covered) plus the 110-idea catalog.

## 6. Prove it works — right now

Repo → **Actions → Daily Tool → Run workflow** → count `1` → Run.
In ~1–2 minutes you should see:
- a green run,
- a new commit like `Add tool: <name>`,
- Vercel auto-deploying the update,
- the new tool live on the site.

If the run goes red, open it — the log says exactly which gate failed (tests, schema, or verify).

## 7. Done — it now runs itself

- **Daily 08:00 IST** — one new, unique, verified tool is added and deployed.
- **Mondays 09:00 IST** — the backlog gardener refills the idea catalog (needs `GROQ_API_KEY` for full effect).

Your only ongoing job: check once in a while that Actions runs are green.

---

### Costs

| Service | Cost |
|---|---|
| GitHub (repo + Actions for public repo) | $0 |
| Vercel Hobby | $0 |
| Groq free tier | $0 |
| **Total** | **$0** |
