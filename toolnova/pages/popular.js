import { buildHead, breadcrumbLD, itemListLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';
import { toolGrid } from '../components/toolCard.js';

export default function popular({ site, popular }) {
  const path = '/popular';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Popular tools' }];
  const head = buildHead({
    site,
    title: `Popular tools — most-used free online utilities | ${site.name}`,
    description: `The most popular free tools on ${site.name} — the utilities people reach for again and again. No sign-up, no uploads, always free.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs), itemListLD(site, 'Popular tools', popular.slice(0, 20))]
  });

  const body = `${breadcrumbs(crumbs)}
<h1>Popular tools</h1>
<p class="muted">The tools visitors use the most. Every one is free and runs entirely in your browser.</p>
${toolGrid(popular)}`;

  return { path, head, body };
}
