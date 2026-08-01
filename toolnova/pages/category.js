import { esc } from '../lib/html.js';
import { buildHead, breadcrumbLD, itemListLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';
import { toolGrid } from '../components/toolCard.js';
import { categoryMeta, categorySlug, categoryEmoji } from '../lib/categories.js';

// One page per category: /category/<slug>
export default function categoryPages({ site, byCategory }) {
  return [...byCategory.entries()].map(([cat, items]) => {
    const slug = categorySlug(cat);
    const path = `/category/${slug}`;
    const meta = categoryMeta(cat);
    const crumbs = [
      { name: 'Home', path: '/' },
      { name: 'Categories', path: '/categories' },
      { name: cat }
    ];
    const sorted = [...items].sort((a, b) => (a.added < b.added ? 1 : -1));
    const head = buildHead({
      site,
      title: `${cat} tools — free online ${cat.toLowerCase()} utilities | ${site.name}`,
      description: `${items.length} free ${cat.toLowerCase()} tools: ${sorted.slice(0, 3).map((t) => t.title).join(', ')}${items.length > 3 ? ' and more' : ''}. No sign-up — everything runs in your browser.`,
      path,
      jsonLd: [breadcrumbLD(site, crumbs), itemListLD(site, `${cat} tools`, sorted)]
    });

    const body = `${breadcrumbs(crumbs)}
<h1>${categoryEmoji(cat)} ${esc(cat)} tools</h1>
<p class="muted">${esc(meta.blurb)} All free, all running locally in your browser.</p>
${toolGrid(sorted)}`;

    return { path, head, body };
  });
}
