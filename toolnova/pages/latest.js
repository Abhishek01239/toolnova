import { esc } from '../lib/html.js';
import { buildHead, breadcrumbLD, itemListLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';
import { toolGrid } from '../components/toolCard.js';

export default function latest({ site, latest }) {
  const path = '/latest';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Latest tools' }];
  const head = buildHead({
    site,
    title: `Latest tools — newest free online utilities | ${site.name}`,
    description: `The newest tools on ${site.name}, sorted by release date. A brand-new, free, browser-based tool is published every morning.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs), itemListLD(site, 'Latest tools', latest.slice(0, 20))]
  });

  const body = `${breadcrumbs(crumbs)}
<h1>Latest tools</h1>
<p class="muted">Newest first — a new tool is published every morning. Currently ${latest.length} tools and counting.</p>
${toolGrid(latest)}`;

  return { path, head, body };
}

export function latestList(tools) {
  return [...tools].sort((a, b) => (a.added < b.added ? 1 : -1) || a.id.localeCompare(b.id));
}
