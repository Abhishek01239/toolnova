import { esc } from '../lib/html.js';
import { buildHead, breadcrumbLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';

export default function privacy({ site }) {
  const path = '/privacy';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Privacy' }];
  const head = buildHead({
    site,
    title: `Privacy policy — ${site.name}`,
    description: `${site.name} tools run entirely in your browser. Nothing you type, paste or upload is sent to a server. Read the full privacy policy.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs)]
  });

  const body = `${breadcrumbs(crumbs)}
<article class="prose">
  <h1>Privacy policy</h1>
  <p class="muted">Last updated: 2026-07-31</p>
  <p><strong>The short version: your data never leaves your browser.</strong> Every tool on ${esc(site.name)} performs its work locally on your device using standard browser APIs. We have no database, no analytics cookies and no accounts.</p>

  <h2>What we collect</h2>
  <ul>
    <li><strong>Nothing you type into a tool.</strong> All processing happens client-side; inputs and results are never transmitted to us.</li>
    <li><strong>No tracking cookies.</strong> The only thing stored on your device is a single <code>localStorage</code> entry remembering your light/dark theme preference, plus — on some tools — your last-used settings. These never leave your device.</li>
  </ul>

  <h2>Hosting provider logs</h2>
  <p>Like any website, the static files are served by a hosting provider (currently Vercel). Their infrastructure may temporarily record standard technical request data such as IP address and user agent. We do not access, combine or share these logs.</p>

  <h2>Third-party services</h2>
  <p>Pages load no third-party scripts, fonts, trackers or advertising networks. All assets are self-hosted.</p>

  <h2>Changes</h2>
  <p>If this policy changes, the update will be published on this page with a new "last updated" date.</p>
</article>`;

  return { path, head, body };
}
