import { esc } from '../lib/html.js';
import { buildHead, breadcrumbLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';

export default function terms({ site }) {
  const path = '/terms';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Terms' }];
  const head = buildHead({
    site,
    title: `Terms of Use — ${site.name}`,
    description: `Terms of use for the free browser-based tools provided by ${site.name}.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs)]
  });

  const body = `${breadcrumbs(crumbs)}
<article class="prose">
  <h1>Terms of Use</h1>
  <p class="muted">Last updated: 2026-09-29</p>

  <p>By using ${esc(site.name)}, you agree to use the site and its tools lawfully and responsibly.</p>

  <h2>Free tools</h2>
  <p>The tools are provided for general informational and productivity purposes. Results should be reviewed before being used for important decisions, production systems or other situations where an error could cause harm.</p>

  <h2>Availability</h2>
  <p>We aim to keep the site useful and available, but individual tools, pages or the site itself may change, be unavailable temporarily, or be removed without notice.</p>

  <h2>Third-party services and advertising</h2>
  <p>Some pages may include third-party resources or advertising. Third-party services operate under their own terms and privacy policies.</p>

  <h2>Open-source code</h2>
  <p>Site source code is available under the license included in the repository. Tool content and branding on the live site may have additional presentation rules.</p>
</article>`;

  return { path, head, body };
}
