import { esc, escAttr } from '../lib/html.js';
import { buildHead, breadcrumbLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';

export default function editorial({ site, byCategory }) {
  const path = '/editorial';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Editorial Policy' }];
  const head = buildHead({
    site,
    title: `Editorial Policy — ${site.name}`,
    description: `How ${site.name} selects, writes, reviews and corrects tools, and how advertising is kept separate from editorial decisions.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs)]
  });

  const body = `${breadcrumbs(crumbs)}
<article class="prose">
  <h1>Editorial Policy</h1>
  <p class="muted">Last updated: 2026-11-03</p>

  <p>${esc(site.name)} publishes browser-based utilities with written explanations. This page explains how each page is produced and reviewed, so you can judge how much weight to give it.</p>

  <h2>Selection</h2>
  <p>A tool is considered for the library when it solves a recurring, clearly defined task and can run safely in a browser. We avoid publishing near-duplicates: if two tools would do essentially the same job, we keep the clearer one. Every published tool belongs to one of ${byCategory.size} categories and is linked from the <a href="/categories">category index</a>.</p>

  <h2>How pages are written</h2>
  <ul>
    <li>Each page starts with a plain-language explanation of what the tool does and who it is for.</li>
    <li>Instructions are written as concrete steps that match the controls on the page.</li>
    <li>Examples use realistic inputs so you can check the output yourself.</li>
    <li>Limitations, assumptions and edge cases are stated rather than hidden.</li>
    <li>Privacy statements describe what actually happens on that specific page.</li>
    <li>FAQs answer questions that arise in practice, not filler questions.</li>
  </ul>

  <h2>Review and corrections</h2>
  <p>Tool behaviour, copy and links are checked before publication. When a reader reports an error, the report is reviewed, the page is corrected, and the change is published through the site's normal build process. Calculator formulas and conversion factors are checked against standard references; where a formula is a simplification, the page says so.</p>

  <h2>Advertising independence</h2>
  <p>${esc(site.name)} is funded by advertising. Advertisers cannot pay for placement in the tool directory, for a favourable description, or for inclusion in a category. Advertising is labelled and kept visually separate from tool controls and results. Ad slots never appear inside an input form or disguised as a button.</p>

  <h2>No automated publishing</h2>
  <p>New tools and edits are reviewed before they are published. We do not publish unedited machine-generated content, and we do not change published explanations automatically.</p>

  <h2>AI assistance</h2>
  <p>Some drafting or code assistance may be used during development. Every published page is reviewed by a person for accuracy, relevance and clarity before release, and the person publishing it is responsible for the result.</p>

  <h2>Contact</h2>
  <p>Report an error or suggest a correction at <a href="mailto:${escAttr(site.contactEmail)}">${esc(site.contactEmail)}</a> or through the <a href="/contact">contact page</a>.</p>
</article>`;

  return { path, head, body };
}
