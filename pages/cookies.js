import { esc, escAttr } from '../lib/html.js';
import { buildHead, breadcrumbLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';

export default function cookies({ site }) {
  const path = '/cookies';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Cookie Policy' }];
  const head = buildHead({
    site,
    title: `Cookie Policy — ${site.name}`,
    description: `How ${site.name} uses local storage and cookies, including Google AdSense advertising cookies, and how to change or withdraw consent.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs)]
  });

  const body = `${breadcrumbs(crumbs)}
<article class="prose">
  <h1>Cookie Policy</h1>
  <p class="muted">Last updated: 2026-11-03</p>

  <p>This policy explains how ${esc(site.name)} uses cookies and similar browser storage. It should be read together with our <a href="/privacy">Privacy Policy</a>.</p>

  <h2>Your choices</h2>
  <p>On your first visit we ask whether you accept advertising and analytics storage. Advertising storage is <strong>denied by default</strong> and is only enabled if you choose “Accept all” or switch on advertising cookies in the preferences panel. You can reopen the panel at any time using the button below or the “Cookie settings” link in the footer.</p>
  <p><button type="button" class="btn btn-primary" data-consent-open>Manage cookie preferences</button></p>

  <h2>Storage we set ourselves</h2>
  <p>These entries are not advertising cookies and are needed for the site to work as expected.</p>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Duration</th></tr></thead>
    <tbody>
      <tr><td><code>tn-consent</code></td><td>localStorage</td><td>Remembers your cookie choice so the banner does not reappear.</td><td>Until you clear site data</td></tr>
      <tr><td><code>tn-theme</code></td><td>localStorage</td><td>Remembers your light or dark theme preference.</td><td>Until you clear site data</td></tr>
    </tbody>
  </table>
  </div>

  <h2>Google AdSense and advertising cookies</h2>
  <p>When advertising storage is granted, Google and its partners may set cookies or read device identifiers to serve, cap, measure and personalise ads. These cookies are controlled by Google, not by ${esc(site.name)}. Typical examples include:</p>
  <div class="table-wrap">
  <table>
    <thead><tr><th>Name</th><th>Provider</th><th>Purpose</th><th>Typical duration</th></tr></thead>
    <tbody>
      <tr><td><code>__gads</code>, <code>__gpi</code></td><td>Google</td><td>Ad delivery, frequency capping and measurement.</td><td>Up to 13 months</td></tr>
      <tr><td><code>__eoi</code></td><td>Google</td><td>Fraud and abuse detection for advertising.</td><td>Up to 13 months</td></tr>
      <tr><td><code>IDE</code>, <code>test_cookie</code></td><td>Google / DoubleClick</td><td>Ad personalisation and verification that the browser accepts cookies.</td><td>Up to 13 months; test cookie expires quickly</td></tr>
      <tr><td><code>NID</code></td><td>Google</td><td>Stores preferences such as language and ad settings.</td><td>Up to 6 months</td></tr>
    </tbody>
  </table>
  </div>
  <p>The exact cookies set can change. Google publishes current details in its <a href="https://policies.google.com/technologies/cookies" rel="noopener noreferrer">cookie documentation</a> and explains how it uses information from partner sites in <a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer">How Google uses data</a>.</p>

  <h2>Opting out of personalised advertising</h2>
  <ul>
    <li>Use the preferences panel above to withdraw advertising consent.</li>
    <li>Change Google ad personalisation at <a href="https://adssettings.google.com" rel="noopener noreferrer">Google Ads Settings</a>.</li>
    <li>Opt out of participating vendors in the US at <a href="https://www.aboutads.info/choices/" rel="noopener noreferrer">aboutads.info</a>, or in Europe at <a href="https://www.youronlinechoices.eu/" rel="noopener noreferrer">Your Online Choices</a>.</li>
    <li>Block or delete cookies in your browser settings. This may not remove ads, but ads will be less relevant.</li>
  </ul>

  <h2>Do Not Track and Global Privacy Control</h2>
  <p>Where your browser sends a Global Privacy Control signal, we treat it as a request to keep non-essential storage disabled until you make an explicit choice in our banner.</p>

  <h2>Changes</h2>
  <p>If our use of cookies changes, this page will be updated and the revision date above will change.</p>

  <h2>Contact</h2>
  <p>Questions about this policy? Email <a href="mailto:${escAttr(site.contactEmail)}">${esc(site.contactEmail)}</a> or use the <a href="/contact">contact page</a>.</p>
</article>`;

  return { path, head, body };
}
