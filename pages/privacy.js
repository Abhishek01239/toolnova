import { esc } from '../lib/html.js';
import { buildHead, breadcrumbLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';

export default function privacy({ site }) {
  const path = '/privacy';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Privacy' }];
  const head = buildHead({
    site,
    title: `Privacy Policy — ${site.name}`,
    description: `Read the ${site.name} privacy policy, including local tool processing, hosting logs, advertising and cookies.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs)]
  });

  const body = `${breadcrumbs(crumbs)}
<article class="prose">
  <h1>Privacy Policy</h1>
  <p class="muted">Last updated: 2026-09-29</p>

  <p>${esc(site.name)} is designed so that supported tools can process your input locally in your browser. Where a tool explicitly uses an external service, that tool's page should identify the relevant dependency.</p>

  <h2>Information handled by tools</h2>
  <ul>
    <li><strong>Tool input.</strong> Browser-only tools process text, numbers and other inputs on your device and do not intentionally send that input to ${esc(site.name)}.</li>
    <li><strong>Local preferences.</strong> The site may use browser local storage for preferences such as light/dark theme or a tool's last-used settings.</li>
  </ul>

  <h2>Hosting and technical data</h2>
  <p>The site is currently hosted on Vercel. Like most web hosts, the hosting infrastructure may process technical request information such as IP address, browser information and timestamps for security, reliability and delivery.</p>

  <h2>Advertising and cookies</h2>
  <p>${esc(site.name)} uses Google AdSense/Google advertising technology. Advertising providers may use cookies, device information and related signals to serve, measure or personalize advertising, subject to their own policies and the choices available to visitors in their advertising settings. You can learn more about Google's advertising and privacy controls through Google's own documentation.</p>
  <p>Advertising scripts are separate from the core functionality of the browser tools. We do not ask you to submit tool input in order to view or use a tool.</p>

  <h2>Third-party resources</h2>
  <p>The site may load third-party resources such as advertising or web fonts. Their handling of information is governed by the respective provider's policies.</p>

  <h2>Changes</h2>
  <p>If this policy changes, the updated version will be published on this page with a new revision date.</p>
</article>`;

  return { path, head, body };
}
