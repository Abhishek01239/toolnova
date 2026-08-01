import { esc, escAttr } from '../lib/html.js';
import { buildHead, breadcrumbLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';

export default function about({ site, tools, byCategory }) {
  const path = '/about';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'About' }];
  const head = buildHead({
    site,
    title: `About — ${site.name}`,
    description: `${site.name} publishes one new free browser-based tool every morning. Learn how the site works and why every tool is private by design.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs)]
  });

  const body = `${breadcrumbs(crumbs)}
<article class="prose">
  <h1>About ${esc(site.name)}</h1>
  <p>${esc(site.name)} is a self-growing collection of useful, browser-based tools. Every morning an automated pipeline adds <strong>one new, fully tested tool</strong> to the site — text utilities, converters, calculators, generators, developer helpers and more. The collection currently holds <strong>${tools.length} tools</strong> across <strong>${byCategory.size} categories</strong>, and it grows every single day.</p>

  <h2>Our principles</h2>
  <ul>
    <li><strong>Free forever.</strong> No accounts, no paywalls, no "pro" tiers.</li>
    <li><strong>Private by design.</strong> Tools run entirely in your browser using standard web APIs. Your text, files and data never leave your device.</li>
    <li><strong>Fast.</strong> Every page is static HTML with a tiny JavaScript footprint — built to score 90+ on Lighthouse.</li>
    <li><strong>Real functionality only.</strong> No placeholder buttons, no fake features. Every tool is validated by an automated quality gate before it ships.</li>
  </ul>

  <h2>How the daily pipeline works</h2>
  <ol>
    <li>A scheduled GitHub Action wakes up every morning.</li>
    <li>It reads the tool registry, picks a new tool that doesn't exist yet, and generates it from a tested template or a reviewed module.</li>
    <li>Automated checks verify SEO fields, structured data, internal links, accessibility basics and JavaScript syntax.</li>
    <li>If and only if every check passes, the tool is committed and deployed — automatically.</li>
  </ol>

  <h2>Open source</h2>
  <p>The entire site — generator, pipeline and tools — is open source under the MIT license. Browse the code on <a href="${escAttr(site.repo)}" rel="noopener">GitHub</a>.</p>
</article>`;

  return { path, head, body };
}
