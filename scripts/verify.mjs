#!/usr/bin/env node
// Post-build quality gate. crawls dist/ like a strict auditor:
//   • every page: exactly one <h1>, unique <title>, meta description,
//     canonical URL, OG tags, parseable JSON-LD
//   • tool pages: #tool-app, WebApplication + BreadcrumbList + FAQPage schema,
//     and a matching client script that passes node --check
//   • every internal link and asset resolves to a real file
//   • sitemap covers every page; robots.txt advertises it
// Exits non-zero if anything fails — used by CI and the daily pipeline.

import { readFile, readdir, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const errors = [];
const err = (msg) => errors.push(msg);

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else files.push(full);
  }
  return files;
}

const fileExists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

function routeOf(file) {
  const rel = path.relative(DIST, file).replaceAll(path.sep, '/');
  if (rel === 'index.html') return '/';
  if (rel === '404.html') return '/404';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'/index.html'.length);
  return '/' + rel;
}

async function main() {
  const site = JSON.parse(await readFile(path.join(ROOT, 'data', 'site.json'), 'utf8'));
  const tools = JSON.parse(await readFile(path.join(ROOT, 'data', 'tools.json'), 'utf8'));

  const files = await walk(DIST);
  const htmlFiles = files.filter((f) => f.endsWith('.html'));
  const jsFiles = files.filter((f) => f.endsWith('.js'));
  if (!htmlFiles.length) err('no HTML files in dist/ — did the build run?');

  const titles = new Map();
  const routes = new Set();
  const pagesMeta = [];

  for (const file of htmlFiles) {
    const route = routeOf(file);
    routes.add(route);
    const html = await readFile(file, 'utf8');
    const name = route;

    const h1Count = (html.match(/<h1[\s>]/g) || []).length;
    if (h1Count !== 1) err(`${name}: expected exactly one <h1>, found ${h1Count}`);

    const titleMatch = html.match(/<title>([^<]*)<\/title>/);
    if (!titleMatch || titleMatch[1].trim().length < 5) err(`${name}: missing or too-short <title>`);
    else {
      const t = titleMatch[1].trim();
      if (titles.has(t)) err(`${name}: duplicate <title> also used by ${titles.get(t)}`);
      titles.set(t, name);
    }

    if (!/<meta name="description" content="[^"]{40,}"/.test(html)) err(`${name}: missing meta description (≥40 chars)`);
    const canon = html.match(/<link rel="canonical" href="([^"]+)"/);
    if (!canon) err(`${name}: missing canonical link`);
    else if (!canon[1].startsWith(site.url)) err(`${name}: canonical ${canon[1]} does not start with site.url`);
    if (!/property="og:title"/.test(html)) err(`${name}: missing og:title`);
    if (!/property="og:image"/.test(html)) err(`${name}: missing og:image`);
    if (!/name="twitter:card"/.test(html)) err(`${name}: missing twitter:card`);

    const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    const ldTypes = [];
    for (const block of ldBlocks) {
      try {
        const parsed = JSON.parse(block[1]);
        ldTypes.push(parsed['@type']);
      } catch {
        err(`${name}: invalid JSON in ld+json block`);
      }
    }
    if (ldBlocks.length === 0) err(`${name}: no JSON-LD structured data`);

    if (route.startsWith('/tools/')) {
      if (!html.includes('id="tool-app"')) err(`${name}: missing #tool-app mount point`);
      for (const needed of ['WebApplication', 'BreadcrumbList', 'FAQPage']) {
        if (!ldTypes.includes(needed)) err(`${name}: missing ${needed} structured data`);
      }
      const toolId = route.split('/')[2];
      if (!(await fileExists(path.join(DIST, 'assets', 'tools', `${toolId}.js`)))) {
        err(`${name}: client script assets/tools/${toolId}.js not found`);
      }
      if (!/<h2>How it works<\/h2>/.test(html)) err(`${name}: missing How it works section`);
      if (!/Frequently asked questions/.test(html)) err(`${name}: missing FAQ section`);
    }

    // Internal link + asset check
    const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = m[1];
      if (/^(https?:|mailto:|tel:|data:)/i.test(url)) continue;
      const hashIdx = url.indexOf('#');
      const beforeHash = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
      const frag = hashIdx >= 0 ? url.slice(hashIdx + 1) : '';
      const target = beforeHash.split('?')[0];
      if (!target) {
        if (frag && !ids.has(frag)) err(`${name}: anchor #${frag} has no matching id`);
        continue;
      }
      let fsPath;
      if (target === '/') fsPath = path.join(DIST, 'index.html');
      else if (path.posix.extname(target)) fsPath = path.join(DIST, target);
      else fsPath = path.join(DIST, target, 'index.html');
      if (!(await fileExists(fsPath))) err(`${name}: broken internal link "${url}"`);
    }
    pagesMeta.push({ route, html });
  }

  // Registry ↔ dist agreement
  for (const tool of tools) {
    if (!routes.has(`/tools/${tool.id}`)) err(`tools.json entry "${tool.id}" has no built page`);
    if (!(await fileExists(path.join(DIST, 'assets', 'tools', `${tool.id}.js`)))) {
      err(`tools.json entry "${tool.id}" has no client script in dist/`);
    }
  }

  // JS syntax
  for (const file of jsFiles) {
    try {
      execFileSync(process.argv[0], ['--check', file], { stdio: 'pipe' });
    } catch (e) {
      err(`${path.relative(DIST, file)}: JavaScript syntax error\n${String(e.stderr).slice(0, 400)}`);
    }
  }

  // Sitemap & robots & search index & RSS
  const sitemap = await readFile(path.join(DIST, 'sitemap.xml'), 'utf8');
  const sitemapCount = (sitemap.match(/<url>/g) || []).length;
  const expectedPages = routes.size - (routes.has('/404') ? 1 : 0);
  if (sitemapCount !== expectedPages) err(`sitemap has ${sitemapCount} urls but ${expectedPages} pages were built`);
  const robots = await readFile(path.join(DIST, 'robots.txt'), 'utf8');
  if (!robots.includes(`Sitemap: ${site.url}/sitemap.xml`)) err('robots.txt missing correct Sitemap line');
  if (!robots.includes(`Sitemap: ${site.url}/rss.xml`)) err('robots.txt missing correct RSS Sitemap line');
  if (robots.includes('Disallow: /')) err('robots.txt blocks crawling');

  const rss = await readFile(path.join(DIST, 'rss.xml'), 'utf8');
  if (!rss.includes('<rss version="2.0"')) err('rss.xml missing correct version or format');
  const rssCount = (rss.match(/<item>/g) || []).length;
  const expectedRssCount = Math.min(tools.length, 20);
  if (rssCount !== expectedRssCount) err(`rss.xml has ${rssCount} items, expected ${expectedRssCount}`);

  const searchIndex = JSON.parse(await readFile(path.join(DIST, 'search.json'), 'utf8'));
  if (searchIndex.length !== tools.length) err(`search.json has ${searchIndex.length} entries for ${tools.length} tools`);

  if (errors.length) {
    console.error(`\n❌ VERIFY FAILED — ${errors.length} problem(s):`);
    for (const e of errors) console.error('  • ' + e);
    process.exit(1);
  }
  console.log(`\n✅ VERIFY PASSED — ${routes.size} pages, ${tools.length} tools, ${jsFiles.length} scripts, 0 problems.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
