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
  <p>Found a broken tool, incorrect result, accessibility problem or something that should be corrected? Please open an issue in the public repository so the report can be tracked and resolved.</p>
  <p><a class="btn btn-primary" href="${escAttr(site.repo)}/issues" rel="noopener noreferrer">Open a GitHub issue</a></p>

  <h2>What to include</h2>
  <ul>
    <li>The tool name or page URL.</li>
    <li>What you expected to happen.</li>
    <li>What actually happened and, if possible, the steps to reproduce it.</li>
    <li>Browser and device details when the issue is visual or accessibility-related.</li>
  </ul>

  <p class="muted">Please do not post passwords, private documents, API keys or other sensitive information in a public issue.</p>
</article>`;

  return { path, head, body };
}
