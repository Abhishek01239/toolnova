import { buildHead, breadcrumbLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';
import { toolGrid } from '../components/toolCard.js';

export default function search({ site, popular }) {
  const path = '/search';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Search' }];
  const head = buildHead({
    site,
    title: `Search tools — ${site.name}`,
    description: `Search ${site.name}'s collection of free browser-based tools: text tools, converters, calculators, generators and developer utilities.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs)]
  });

  const body = `${breadcrumbs(crumbs)}
<h1>Search tools</h1>
<div class="search-hero">
  <form action="/search" method="get" role="search" id="search-form">
    <input type="search" name="q" id="search-input" placeholder="Try “word counter”, “json”, “password”…" aria-label="Search tools" autocomplete="off" autofocus>
    <button class="btn btn-primary" type="submit">Search</button>
  </form>
</div>
<p class="search-results-meta" id="search-results-meta" role="status">Type above to search all tools.</p>
<div id="results" aria-live="polite"></div>
<section class="section" id="search-fallback">
  <div class="section-head"><h2>Popular tools</h2></div>
  ${toolGrid(popular.slice(0, 8))}
</section>`;

  return { path, head, body, scripts: ['/assets/search.js'] };
}
