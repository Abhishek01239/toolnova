import { esc, escAttr } from '../lib/html.js';
import { buildHead, breadcrumbLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';

export default function about({ site, tools, byCategory }) {
  const path = '/about';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'About' }];
  const head = buildHead({
    site,
    title: `About — ${site.name}`,
    description: `${site.name} is a curated collection of free browser-based tools with clear explanations, practical functionality and privacy-conscious defaults.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs)]
  });

  const body = `${breadcrumbs(crumbs)}
<article class="prose">
  <h1>About ${esc(site.name)}</h1>
  <p>${esc(site.name)} is a curated collection of useful, browser-based tools. The library currently contains <strong>${tools.length} tools</strong> across <strong>${byCategory.size} categories</strong>, covering text, developer utilities, converters, calculators, generators and other everyday tasks.</p>

  <h2>Our principles</h2>
  <ul>
    <li><strong>Useful first.</strong> Each published tool should solve a clear problem and explain what it does.</li>
    <li><strong>Privacy-conscious.</strong> Supported tools process input in your browser and do not need an account.</li>
    <li><strong>Fast.</strong> The site is generated as static HTML with a small JavaScript footprint.</li>
    <li><strong>Transparent.</strong> Tool content and site code are maintained in the public repository.</li>
  </ul>

  <h2>How ToolNova is maintained</h2>
  <p>Tool additions and changes are now <strong>deliberately manual</strong>. Nothing on the site should be silently created, selected or committed by a scheduled GitHub Action. New tools are added only when explicitly reviewed and approved for publication.</p>
  <p>This keeps the catalogue predictable: no surprise tools, no unattended content generation and no automated commits changing the public site behind the scenes.</p>

  <h2>Editorial standards</h2>
  <p>Every tool page explains what the tool does, how to use it, a worked example, its limitations and how it handles your data. Pages are reviewed before publication and corrected when a reader reports a problem. Our full process is described in the <a href="/editorial">Editorial Policy</a>.</p>

  <h2>Who runs the site</h2>
  <p>${esc(site.name)} is an independent, ad-supported project. The tools and written content are maintained alongside the public source repository. For questions, corrections or privacy requests, email <a href="mailto:${escAttr(site.contactEmail)}">${esc(site.contactEmail)}</a> or use the <a href="/contact">contact page</a>.</p>

  <h2>Advertising</h2>
  <p>ToolNova displays advertising through Google AdSense to support hosting and continued development. Advertising does not change which tools are published or how they are described, and advertising cookies are disabled until you consent. See the <a href="/privacy">Privacy Policy</a> and <a href="/cookies">Cookie Policy</a> for details.</p>

  <h2>Open source</h2>
  <p>The site and its tooling are open source under the MIT license. Browse the code on <a href="${escAttr(site.repo)}" rel="noopener noreferrer">GitHub</a>.</p>
</article>`;

  return { path, head, body };
}
