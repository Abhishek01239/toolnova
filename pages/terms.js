import { esc, escAttr } from '../lib/html.js';
import { buildHead, breadcrumbLD } from '../lib/seo.js';
import { breadcrumbs } from '../components/breadcrumbs.js';

export default function terms({ site }) {
  const path = '/terms';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Terms' }];
  const head = buildHead({
    site,
    title: `Terms of Use — ${site.name}`,
    description: `The terms that apply when you use ${site.name}: acceptable use, intellectual property, advertising, disclaimers and liability.`,
    path,
    jsonLd: [breadcrumbLD(site, crumbs)]
  });

  const body = `${breadcrumbs(crumbs)}
<article class="prose">
  <h1>Terms of Use</h1>
  <p class="muted">Last updated: 2026-11-03</p>

  <p>By accessing or using ${esc(site.name)}, you agree to these terms. If you do not agree, please do not use the site.</p>

  <h2>The service</h2>
  <p>${esc(site.name)} provides free browser-based utilities and written explanations. The service is provided as-is and may change, be interrupted or be withdrawn at any time. We do not guarantee that any particular tool will remain available.</p>

  <h2>Permitted use</h2>
  <p>You may use the tools for personal or commercial work. You may not:</p>
  <ul>
    <li>Use the site to break the law, infringe rights or facilitate harm.</li>
    <li>Attempt to gain unauthorised access to the site, its infrastructure or other users' systems.</li>
    <li>Interfere with the site's availability, including through automated scraping that degrades service, denial-of-service activity or bypassing rate limits.</li>
    <li>Remove or obscure advertising in a way that violates the applicable advertising terms.</li>
    <li>Misrepresent the source of the tools or pass off the site's content as your own.</li>
  </ul>

  <h2>Your input</h2>
  <p>You retain ownership of the text, numbers and files you use with the tools. Because processing happens in your browser, we do not claim a licence over that input. You are responsible for ensuring you have the right to use any material you process.</p>

  <h2>Intellectual property</h2>
  <p>The site's design, written explanations, branding and original code are protected by applicable intellectual property laws. The source code is made available under the licence stated in the public repository. Open-source components remain subject to their own licences.</p>

  <h2>Advertising and third-party services</h2>
  <p>Pages may display advertising served by Google AdSense and may load third-party fonts or libraries. Third-party services operate under their own terms and privacy policies. We are not responsible for third-party content, products or services.</p>

  <h2>No professional advice</h2>
  <p>Calculators and explanatory content are for general information only and are not financial, medical, legal, tax or security advice. Read the <a href="/disclaimer">Disclaimer</a> before relying on a result.</p>

  <h2>Disclaimer of warranties</h2>
  <p>To the maximum extent permitted by law, the site and tools are provided without warranties of any kind, express or implied, including fitness for a particular purpose, accuracy and non-infringement.</p>

  <h2>Limitation of liability</h2>
  <p>To the maximum extent permitted by law, ${esc(site.name)} and its operator are not liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, data, goodwill or business opportunities, arising from your use of or inability to use the site. Where liability cannot be excluded, it is limited to the amount you paid to use the site, which is zero.</p>

  <h2>Indemnity</h2>
  <p>You agree to indemnify the site operator against claims and costs arising from your misuse of the site or violation of these terms, to the extent permitted by law.</p>

  <h2>Privacy</h2>
  <p>Our <a href="/privacy">Privacy Policy</a> and <a href="/cookies">Cookie Policy</a> explain how data is handled and form part of these terms.</p>

  <h2>Changes</h2>
  <p>We may update these terms. The revision date at the top of this page will change, and continued use after an update constitutes acceptance of the revised terms.</p>

  <h2>Governing law</h2>
  <p>These terms are governed by the laws applicable in the operator's place of establishment, without regard to conflict-of-law rules. Nothing here limits mandatory consumer rights available in your country of residence.</p>

  <h2>Contact</h2>
  <p>Questions about these terms: <a href="mailto:${escAttr(site.contactEmail)}">${esc(site.contactEmail)}</a> or the <a href="/contact">contact page</a>.</p>
</article>`;

  return { path, head, body };
}
