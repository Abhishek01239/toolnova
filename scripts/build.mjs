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
import cookiesPage from '../pages/cookies.js';
import disclaimerPage from '../pages/disclaimer.js';
import editorialPage from '../pages/editorial.js';
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

// Editorial content lives in data/content/*.json, keyed by tool id. Requiring it
// keeps every published page above the thin-content threshold.
async function loadContent() {
  const dir = path.join(ROOT, 'data', 'content');
  const merged = {};
  try {
    const names = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
    for (const name of names) Object.assign(merged, await readJson(path.join(dir, name)));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return merged;
}

function wordCount(text) {
  return String(text).split(/\s+/).filter(Boolean).length;
}

function validateContent(id, content) {
  const problems = [];
  if (!content || typeof content !== 'object') return ['content entry is missing'];
  if (!Array.isArray(content.overview) || content.overview.length < 2) problems.push('overview must have at least 2 paragraphs');
  if (!Array.isArray(content.useCases) || content.useCases.length < 3) problems.push('useCases must have at least 3 items');
  if (!Array.isArray(content.limits) || content.limits.length < 3) problems.push('limits must have at least 3 items');
  if (typeof content.workedExample !== 'string' || wordCount(content.workedExample) < 35) problems.push('workedExample must be at least 35 words');
  if (typeof content.privacy !== 'string' || wordCount(content.privacy) < 12) problems.push('privacy note must be at least 12 words');
  if (content.faq !== undefined && (!Array.isArray(content.faq) || content.faq.some((f) => !f.q || !f.a))) problems.push('faq must be an array of {q,a}');
  const total = [
    ...(content.overview || []),
    ...(content.useCases || []),
    content.workedExample || '',
    ...(content.limits || []),
    content.privacy || '',
    ...(content.faq || []).flatMap((f) => [f.q, f.a])
  ].join(' ');
  if (wordCount(total) < 200) problems.push(`only ${wordCount(total)} words of new content (minimum 200)`);
  if (problems.length) return problems;
  return [];
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
  for (const tool of tools) add(`/tools/${tool.id}`, { lastmod: tool.reviewed || tool.added, changefreq: 'monthly', priority: '0.8' });
  add('/about', { changefreq: 'yearly', priority: '0.3' });
  add('/editorial', { changefreq: 'yearly', priority: '0.3' });
  add('/privacy', { changefreq: 'yearly', priority: '0.3' });
  add('/cookies', { changefreq: 'yearly', priority: '0.3' });
  add('/terms', { changefreq: 'yearly', priority: '0.3' });
  add('/disclaimer', { changefreq: 'yearly', priority: '0.3' });
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

  const contentMap = await loadContent();
  const missingContent = [];
  for (const tool of tools) {
    const content = contentMap[tool.id];
    if (!content) {
      missingContent.push(tool.id);
      continue;
    }
    const problems = validateContent(tool.id, content);
    if (problems.length) throw new Error(`Content for "${tool.id}" failed validation:\n  - ${problems.join('\n  - ')}`);
    tool.content = content;
    tool.reviewed = content.reviewed || '2026-11-03';
    if (Array.isArray(content.faq) && content.faq.length) tool.faq = [...tool.faq, ...content.faq];
  }
  if (missingContent.length && process.env.ALLOW_MISSING_CONTENT !== '1') {
    throw new Error(`Missing editorial content for ${missingContent.length} tools: ${missingContent.join(', ')}`);
  }

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

  const staticRenderers = [homePage, searchPage, categoriesPage, latestPage, popularPage, aboutPage, privacyPage, cookiesPage, termsPage, disclaimerPage, editorialPage, contactPage, notFoundPage];
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
