import { esc, escAttr } from '../lib/html.js';
import { buildHead, breadcrumbLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';

export default function contact({ site }) {
  const path = '/contact';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Contact' }];
  const head = buildHead({
    site,
    title: `Contact — ${site.name}`,
    description: `Contact ${site.name} about a broken tool, accessibility issue, correction or general site feedback.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs)]
  });

  const body = `${breadcrumbs(crumbs)}
<article class="prose">
  <h1>Contact ${esc(site.name)}</h1>
  <p>Found a broken tool, an incorrect result, an accessibility problem or something that should be corrected? We read every message and aim to reply within a few business days.</p>
  <p><a class="btn btn-primary" href="mailto:${escAttr(site.contactEmail)}?subject=${escAttr(site.name + ' feedback')}">Email ${esc(site.contactEmail)}</a></p>

  <h2>Report an error</h2>
  <p>You can also open a public issue in the repository if you prefer a tracked thread:</p>
  <p><a class="btn btn-ghost" href="${escAttr(site.repo)}/issues" rel="noopener noreferrer">Open a GitHub issue</a></p>

  <h2>What to include</h2>
  <ul>
    <li>The tool name or page URL.</li>
    <li>What you expected to happen.</li>
    <li>What actually happened and, if possible, the steps to reproduce it.</li>
    <li>Browser and device details when the issue is visual or accessibility-related.</li>
  </ul>

  <h2>Advertising, privacy and legal</h2>
  <p>For privacy requests, including access or deletion requests, email the address above with “Privacy” in the subject. For advertising or content-removal enquiries, include the exact URL and the reason for the request.</p>

  <p class="muted">Please do not post passwords, private documents, API keys or other sensitive information in an email or public issue.</p>
</article>`;

  return { path, head, body };
}
