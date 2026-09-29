import { esc } from '../lib/html.js';
import { buildHead, websiteLD, organizationLD, itemListLD } from '../lib/seo.js';
import { toolGrid, categoryChip } from '../components/toolCard.js';
import { categorySlug, categoryEmoji } from '../lib/categories.js';

export default function home({ site, tools, byCategory, latest, popular }) {
  const head = buildHead({
    site,
    title: `${site.name} — ${site.shortTagline}`,
    description: site.description,
    path: '/',
    jsonLd: [websiteLD(site), organizationLD(site), itemListLD(site, 'Featured tools', popular.slice(0, 8))]
  });

  const chips = [...byCategory.keys()]
    .sort((a, b) => byCategory.get(b).length - byCategory.get(a).length)
    .map((cat) => categoryChip(cat, byCategory.get(cat).length))
    .join('\n');

  const directory = [...byCategory.keys()]
    .sort()
    .map((cat) => {
      const links = [...byCategory.get(cat)]
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((t) => `<a href="/tools/${t.id}">${esc(t.title)}</a>`)
        .join('\n');
      return `<div class="directory-group" id="${categorySlug(cat)}">
  <h3><span aria-hidden="true">${categoryEmoji(cat)}</span> ${esc(cat)}</h3>
  <div class="directory-links">${links}</div>
</div>`;
    }).join('\n');

  const body = `<section class="hero">
  <div class="hero-eyebrow"><span>TOOLNOVA</span><span>•</span><span>FREE &amp; BROWSER-BASED</span></div>
  <h1>Useful tools, <span class="hero-grad">without the friction.</span></h1>
  <p class="lead">${esc(site.tagline)}. Search a growing library of practical utilities for text, code, conversion, calculation and more — no account required.</p>
  <form class="hero-search" action="/search" method="get" role="search">
    <input type="search" name="q" placeholder="Search ${tools.length} tools…" aria-label="Search tools" autofocus>
    <button class="btn btn-primary" type="submit">Find a tool</button>
  </form>
  <div class="hero-stats">
    <span class="stat-chip"><strong>${tools.length}</strong> tools</span>
    <span class="stat-chip"><strong>${byCategory.size}</strong> categories</span>
    <span class="stat-chip"><strong>100%</strong> free</span>
    <span class="stat-chip"><strong>0</strong> sign-up required</span>
  </div>
</section>

<section class="trust-strip" aria-label="ToolNova benefits">
  <div><span class="trust-icon">⚡</span><strong>Fast</strong><span>Lightweight static pages</span></div>
  <div><span class="trust-icon">🔒</span><strong>Private</strong><span>Local processing where supported</span></div>
  <div><span class="trust-icon">✓</span><strong>Practical</strong><span>Focused tools with clear instructions</span></div>
</section>

<section class="section" aria-labelledby="cat-heading">
  <div class="section-head">
    <h2 id="cat-heading">Explore categories</h2>
    <a href="/categories">View all →</a>
  </div>
  <div class="category-chips">${chips}</div>
</section>

<section class="section" aria-labelledby="popular-heading">
  <div class="section-head">
    <h2 id="popular-heading">Popular tools</h2>
    <a href="/popular">See all →</a>
  </div>
  ${toolGrid(popular.slice(0, 8))}
</section>

<section class="section" aria-labelledby="latest-heading">
  <div class="section-head">
    <h2 id="latest-heading">Recently added</h2>
    <a href="/latest">See all →</a>
  </div>
  ${toolGrid(latest.slice(0, 8))}
</section>

<section class="section directory-section" aria-labelledby="all-heading">
  <div class="section-head">
    <h2 id="all-heading">Full tool directory</h2>
    <a href="/search">Search everything →</a>
  </div>
  ${directory}
</section>

<section class="editorial-note">
  <div>
    <span class="eyebrow">BUILT FOR EVERYDAY WORK</span>
    <h2>Simple tools that get out of your way.</h2>
  </div>
  <p>ToolNova focuses on useful browser utilities with straightforward interfaces, accessible pages, helpful explanations and privacy-conscious defaults.</p>
</section>`;

  return { path: '/', head, body };
}
