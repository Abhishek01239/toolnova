#!/usr/bin/env node
// Builds the complete static ToolNova site from the reviewed data registry.
import { readFile, writeFile, mkdir, cp, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateRegistry } from '../lib/registry.js';
import { page } from '../lib/layout.js';
import { renderToolPage } from '../lib/render.js';
import { categorySlug, categoryEmoji } from '../lib/categories.js';
import { truncate, esc } from '../lib/html.js';

import homePage from '../pages/home.js';
import searchPage from '../pages/search.js';
import categoriesPage from '../pages/categories.js';
import categoryPages from '../pages/category.js';
import latestPage from '../pages/latest.js';
import popularPage from '../pages/popular.js';
import aboutPage from '../pages/about.js';
import privacyPage from '../pages/privacy.js';
import termsPage from '../pages/terms.js';
import contactPage from '../pages/contact.js';
import notFoundPage from '../pages/notFound.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

// Hand-added tools live one-per-file in data/tools.d/*.json (each file holds a
// single registry entry or an array of entries) and are merged after tools.json.
async function loadManualTools() {
  const dir = path.join(ROOT, 'data', 'tools.d');
  let names;
  try {
    names = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const out = [];
  for (const name of names) {
    const parsed = await readJson(path.join(dir, name));
    out.push(...(Array.isArray(parsed) ? parsed : [parsed]));
  }
  return out;
}

async function writePage(relPath, html, overrideFile) {
  const file = overrideFile
    ? path.join(DIST, overrideFile)
    : path.join(DIST, relPath === '/' ? 'index.html' : relPath.slice(1), relPath === '/' ? '' : 'index.html');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html, 'utf8');
}

async function copyToolsJs() {
  const outDir = path.join(DIST, 'assets', 'tools');
  await mkdir(outDir, { recursive: true });
  const files = (await readdir(path.join(ROOT, 'tools'))).filter((f) => f.endsWith('.js'));
  for (const file of files) await cp(path.join(ROOT, 'tools', file), path.join(outDir, file));
  return files.length;
}

function buildSitemap(site, tools, byCategory, extraPages) {
  const urls = [];
  const add = (loc, { lastmod, changefreq = 'weekly', priority = '0.5' } = {}) => {
    urls.push(`  <url>\n    <loc>${site.url}${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`);
  };
  add('/', { changefreq: 'daily', priority: '1.0' });
  for (const p of extraPages) add(p, { priority: '0.5' });
  for (const cat of byCategory.keys()) add(`/category/${categorySlug(cat)}`, { priority: '0.6' });
  for (const tool of tools) add(`/tools/${tool.id}`, { lastmod: tool.added, changefreq: 'monthly', priority: '0.8' });
  add('/about', { changefreq: 'yearly', priority: '0.3' });
  add('/privacy', { changefreq: 'yearly', priority: '0.3' });
  add('/terms', { changefreq: 'yearly', priority: '0.3' });
  add('/contact', { changefreq: 'yearly', priority: '0.3' });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function buildRss(site, tools) {
  const latestTools = [...tools].sort((a, b) => (a.added < b.added ? 1 : -1) || a.id.localeCompare(b.id)).slice(0, 20);
  const items = latestTools.map((tool) => {
    const link = `${site.url}/tools/${tool.id}`;
    return `    <item>\n      <title>${esc(tool.title)}</title>\n      <link>${link}</link>\n      <guid isPermaLink="true">${link}</guid>\n      <pubDate>${new Date(tool.added).toUTCString()}</pubDate>\n      <description>${esc(tool.blurb || tool.description)}</description>\n      <category>${esc(tool.category)}</category>\n    </item>`;
  });
  return `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n  <title>${esc(site.name)}</title>\n  <link>${site.url}</link>\n  <description>${esc(site.description)}</description>\n  <language>en-us</language>\n  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n  <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml" />\n${items.join('\n')}\n</channel>\n</rss>`;
}

async function main() {
  const site = await readJson(path.join(ROOT, 'data', 'site.json'));
  const tools = [...(await readJson(path.join(ROOT, 'data', 'tools.json'))), ...(await loadManualTools())];
  validateRegistry(tools);

  const byCategory = new Map();
  for (const tool of tools) {
    if (!byCategory.has(tool.category)) byCategory.set(tool.category, []);
    byCategory.get(tool.category).push(tool);
  }
  const latest = [...tools].sort((a, b) => (a.added < b.added ? 1 : -1) || a.id.localeCompare(b.id));
  const popular = [...tools].sort((a, b) => b.popularity - a.popularity || a.title.localeCompare(b.title));
  const ctx = { site, tools, byCategory, latest, popular };

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await cp(path.join(ROOT, 'public'), DIST, { recursive: true });
  const toolScripts = await copyToolsJs();

  const relatedFor = (tool) => {
    const sameCat = (byCategory.get(tool.category) || []).filter((t) => t.id !== tool.id);
    const rest = tools.filter((t) => t.id !== tool.id && t.category !== tool.category);
    const byPop = (a, b) => b.popularity - a.popularity || a.title.localeCompare(b.title);
    return [...sameCat.sort(byPop), ...rest.sort(byPop)].slice(0, 4);
  };

  let pages = 0;
  for (const tool of tools) {
    const rendered = renderToolPage({ site, tool, related: relatedFor(tool) });
    await writePage(rendered.path, page({ site, tools, path: rendered.path, head: rendered.head, body: rendered.body, scripts: rendered.scripts }));
    pages++;
  }

  const staticRenderers = [homePage, searchPage, categoriesPage, latestPage, popularPage, aboutPage, privacyPage, termsPage, contactPage, notFoundPage];
  for (const render of staticRenderers) {
    const result = render(ctx);
    const results = Array.isArray(result) ? result : [result];
    for (const r of results) {
      await writePage(r.path, page({ site, tools, path: r.path, head: r.head, body: r.body, scripts: r.scripts }), r.file);
      pages++;
    }
  }
  for (const r of categoryPages(ctx)) {
    await writePage(r.path, page({ site, tools, path: r.path, head: r.head, body: r.body, scripts: r.scripts }));
    pages++;
  }

  const searchIndex = tools.map((t) => ({ i: t.id, t: t.title, d: truncate(t.blurb || t.description, 110), c: t.category, e: categoryEmoji(t.category), k: t.keywords.join(' ') }));
  await writeFile(path.join(DIST, 'search.json'), JSON.stringify(searchIndex), 'utf8');
  await writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(site, tools, byCategory, ['/search', '/categories', '/latest', '/popular']), 'utf8');
  await writeFile(path.join(DIST, 'rss.xml'), buildRss(site, tools), 'utf8');
  await writeFile(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\nSitemap: ${site.url}/rss.xml\n`, 'utf8');

  console.log(`Built ${pages} pages: ${tools.length} tools, ${byCategory.size} categories, ${toolScripts} tool scripts → dist/`);
}
main().catch((err) => { console.error(err); process.exit(1); });
