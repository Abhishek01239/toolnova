import { buildHead, websiteLD } from '../lib/seo.js';
import { toolGrid } from '../components/toolCard.js';

export default function notFound({ site, popular }) {
  const head = buildHead({
    site,
    title: `Page not found — ${site.name}`,
    description: 'The page you are looking for does not exist. Browse popular free tools instead.',
    path: '/404',
    jsonLd: [websiteLD(site)]
  });

  const body = `<section class="not-found">
  <p class="code hero-grad-404">404</p>
  <h1>Page not found</h1>
  <p class="muted">That page doesn't exist (maybe it's tomorrow's tool — one is added every morning).</p>
  <p><a class="btn btn-primary" href="/">Back to all tools</a> <a class="btn" href="/search">Search tools</a></p>
</section>
<section class="section">
  <div class="section-head"><h2>Popular tools</h2></div>
  ${toolGrid(popular.slice(0, 4))}
</section>`;

  return { path: '/404', head, body, file: '404.html' };
}
