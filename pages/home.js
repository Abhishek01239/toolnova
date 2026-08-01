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
    jsonLd: [websiteLD(site), organizationLD(site), itemListLD(site, 'Latest tools', latest.slice(0, 8))]
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
  <h1>Free online tools, <span class="hero-grad">one new tool every day</span></h1>
  <p class="lead">${esc(site.tagline)}. Fast, privacy-friendly utilities for text, code, conversion, calculation and more — no sign-up, no uploads, no cost.</p>
  <form class="hero-search" action="/search" method="get" role="search">
    <input type="search" name="q" placeholder="Search ${tools.length} tools…" aria-label="Search tools" autofocus>
    <button class="btn btn-primary" type="submit">Search</button>
  </form>
  <div class="hero-stats">
    <span class="stat-chip"><strong>${tools.length}</strong> tools</span>
    <span class="stat-chip"><strong>${byCategory.size}</strong> categories</span>
    <span class="stat-chip"><strong>100%</strong> free</span>
    <span class="stat-chip"><strong>0</strong> data uploads</span>
    <span class="stat-chip"><strong>1</strong> new tool daily</span>
  </div>
</section>

<section class="section" aria-labelledby="cat-heading">
  <div class="section-head">
    <h2 id="cat-heading">Browse by category</h2>
    <a href="/categories">All categories →</a>
  </div>
  <div class="category-chips">${chips}</div>
</section>

<section class="section" aria-labelledby="latest-heading">
  <div class="section-head">
    <h2 id="latest-heading">Latest tools</h2>
    <a href="/latest">See all →</a>
  </div>
  ${toolGrid(latest.slice(0, 8))}
</section>

<section class="section" aria-labelledby="popular-heading">
  <div class="section-head">
    <h2 id="popular-heading">Popular tools</h2>
    <a href="/popular">See all →</a>
  </div>
  ${toolGrid(popular.slice(0, 8))}
</section>

<section class="section" aria-labelledby="all-heading">
  <div class="section-head">
    <h2 id="all-heading">All tools</h2>
  </div>
  ${directory}
</section>`;

  return { path: '/', head, body };
}
