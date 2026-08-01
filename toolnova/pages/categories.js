import { esc } from '../lib/html.js';
import { buildHead, breadcrumbLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';
import { categoryMeta, categorySlug, categoryEmoji } from '../lib/categories.js';

export default function categories({ site, byCategory }) {
  const path = '/categories';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Categories' }];
  const head = buildHead({
    site,
    title: `Tool categories — ${site.name}`,
    description: 'Browse all tool categories: text tools, developer utilities, unit converters, calculators, generators, security tools and more — all free.',
    path,
    jsonLd: [breadcrumbLD(site, crumbs)]
  });

  const cards = [...byCategory.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([cat, items]) => {
      const meta = categoryMeta(cat);
      return `<a class="cat-card" href="/category/${categorySlug(cat)}">
  <span class="cat-emoji" aria-hidden="true">${categoryEmoji(cat)}</span>
  <h3>${esc(cat)}</h3>
  <p>${esc(meta.blurb)}</p>
  <p><span class="count">${items.length}</span> tool${items.length === 1 ? '' : 's'}</p>
</a>`;
    }).join('\n');

  const body = `${breadcrumbs(crumbs)}
<h1>Tool categories</h1>
<p class="muted">Every category grows automatically — a new tool is published every morning.</p>
<div class="cat-grid">${cards}</div>`;

  return { path, head, body };
}
